import StructProxyHandle from "./StructProxyHandle.mjs";
import { AsBigInt, CStructs, CTypes } from "./Utils.mjs";

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

    // TODO! native typed arrays support (detectable by '$type[$n]' expression)...
    // TODO! interpret expression support
    $expression($name, $mT) { 
        return {
            $name: $mT,
            $array: false
        };
    }

    //
    get($name) {
        const $memT = this.#layout.$get($name);
        const $type = this.$expression($name, $memT.$type);

        // if inline array index
        if (!isNaN(parseInt($type.$name))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + this.#layout.$byteLength * parseInt($type.$name)), new StructProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$type.$name]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + $memT.$byteOffset), new StructProxyHandle(CStructs[$type.$name]));
        }

        //
        if ($type.$array) { return new CTypes[$type.$name](this.#target.buffer, this.#byteOffset + this.#target.byteOffset + $memT.$byteOffset, ($type.$array || 1)); };

        // get primitive
        return this.#target["get" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $memT.$byteOffset, true);
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
        { return this.#target["set" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1))](this.#byteOffset + $memT.$byteOffset, $member, true); };
    }
}
