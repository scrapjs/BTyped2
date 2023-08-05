import ProxyHandle from "./ProxyHandle.mjs";
import { CTypes } from "./ArrayLayout.mjs";
import { CStructs } from "./StructLayout.mjs";
import { AsBigInt, AsInt } from "./Utils.mjs";

//
export default class StructView {
    #target = null;
    #layout = null;
    #byteOffset = 0;
    #length = 1;

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        this.#layout = (typeof layout == "string") ? CStructs[layout] : layout;
        this.#target = target;
        this.#byteOffset = byteOffset;
        this.#length = length;
    }

    //
    get $isView() { return true; };
    get $length() { return this.#length; };
    get $byteOffset() { return this.#byteOffset; };
    get $byteLength() { return (this.$length * this.#layout.$byteLength); };
    get $ownKeys() { return [...Object.keys(this.#layout.$layout), ...Array.from({length: this.#length}, (_, i) => i)]; };
    get $layout() { return this.#layout; };
    get $buffer() { return (this.#target?.buffer || this.#target); };

    //
    $has($name) { return ($name in this.#layout); };

    // 
    $typeof($name, $mT) {
        let $array = false;
        let $offset = 0;
        let $default = 0;

        //
        $mT = $mT.trim(), $name = $name.trim();
        if ($name.indexOf(":") >= 0) { [$name, $mT ] = $name.vsplit(":"); };
        $mT = $mT.trim(), $name = $name.trim();
        if ($mT.indexOf(";") >= 0) { [$mT, $default ] = $mT.vsplit(";"); };
        $mT = $mT.trim(), $default = JSON.parse($default.trim());

        // 
        if ($mT.indexOf("[") >= 0 && $mT.indexOf("]") >= 0) {
            let $match = $mT.match(/\[(-?\d+)\]/);
            $array = ($match ? AsInt($match[1]) : 1) || 1;
            $mT = $mT.replace(/\[\d+\]/g, "");
        };

        // 
        if ($mT.indexOf("(") >= 0 && $mT.indexOf(")") >= 0) {
            let $match = $mT.match(/\((-?\d+)\)/);
            $offset = ($match ? AsInt($match[1]) : 0) || 0;
            $mT = $mT.replace(/\(\d+\)/g, "");
        };

        //
        return {
            $name: $mT,
            $array, $offset,
            $default
        };
    }

    //
    $initial() {
        this.$ownKeys.forEach(($e)=>{ this.$set($e, this.$typeof($e).$default); });
        return this;
    }

    //
    $get($name) {
        const $memT = this.#layout.$get($name);
        const $type = this.$typeof($name, $memT.$type);

        // if inline array index
        if (!isNaN(parseInt($type.$name))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + this.#layout.$byteLength * parseInt($type.$name)), new ProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$type.$name]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + $memT.$byteOffset), new ProxyHandle(CStructs[$type.$name]));
        }

        //
        if (CTypes[$type.$name] && $type.$array) { 
            //return new CTypes[$type.$name](this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + $memT.$byteOffset, ($type.$array || 1)); 
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + $memT.$byteOffset), new ProxyHandle(CTypes[$type.$name]));
        };

        // get primitive
        return this.#target["get" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $type.$offset + $memT.$byteOffset, true);
    }

    // 
    $set($name, $member = 0) {
        const $memT = this.#layout.$get($name);
        const $type = this.$typeof($name, $memT.$type);
        const $obj = this.$get($name);

        // assign members (if struct to struct, will try to recursively)
        if ($type.$name.includes("int64")) { $member = AsBigInt($member); }
        if ($type.$name.includes("int32")) { $member = AsInt($member); }

        //
        if (typeof $obj == "object" && typeof $member == "object") 
            { Object.assign($obj, $member); }

        // set primitive
        if (typeof $member == "number" || typeof $member == "bigint") 
            { this.#target["set" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $type.$offset + $memT.$byteOffset, $member, true); };

        //
        return true;
    }
};
