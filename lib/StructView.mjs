import StructProxyHandle from "./StructProxyHandle.mjs";
import { AsBigInt, CStructs, CTypes, AsInt } from "./Utils.mjs";

//
export default class StructView {
    #target = null;
    #layout = null;
    #byteOffset = 0;

    //
    constructor(layout, target, byteOffset = 0) {
        this.#layout = layout;
        this.#target = target;
        this.#byteOffset = byteOffset;
    }

    // 
    $expression($name, $mT) {
        let $array = false;
        let $offset = 0;
        let $default = null;

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
    get($name) {
        const $memT = this.#layout.$get($name);
        const $type = this.$expression($name, $memT.$type);

        // if inline array index
        if (!isNaN(parseInt($type.$name))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + this.#layout.$byteLength * parseInt($type.$name)), new StructProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$type.$name]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + $memT.$byteOffset), new StructProxyHandle(CStructs[$type.$name]));
        }

        //
        if ($type.$array) { return new CTypes[$type.$name](this.#target.buffer, this.#byteOffset + $type.$offset + this.#target.byteOffset + $memT.$byteOffset, ($type.$array || 1)); };

        // get primitive
        return this.#target["get" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $type.$offset + $memT.$byteOffset, true);
    }

    // 
    set($name, $member = 0) {
        const $memT = this.#layout.$get($name);
        const $type = this.$expression($name, $memT.$type);
        const $obj = this.get($name);

        // assign members (if struct to struct, will try to recursively)
        if ($type.$name.includes("int64")) { $member = AsBigInt($member); } else 
        if (typeof $obj == "object") { Object.assign($obj, $member); } else
        if ($type.$array) { $obj.set($member); } else

        // set primitive
        { this.#target["set" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $type.$offset + $memT.$byteOffset, $member, true); };

        //
        return true;
    }
};
