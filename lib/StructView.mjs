import StructProxyHandle from "./StructProxyHandle.mjs";
import { AsBigInt, CStructs } from "./Utils.mjs";

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

    // TODO! interpret expression support
    $expression(name, mT) { return mT; }

    //
    get($name) {
        const $memT = this.#layout.$get($name);
        const $type = this.$expression($name, $memT.$type);

        // if inline array index
        if (!isNaN(parseInt($type))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + this.#layout.$byteLength * parseInt($type)), new StructProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$type]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + $memT.$byteOffset), new StructProxyHandle(CStructs[$type]));
        }

        // TODO! native typed arrays support (detectable by '$type[$n]' expression)...

        // get primitive
        return this.#target["get" + ($type.includes("int64") ? "Big" : "") + ($type.charAt(0).toUpperCase() + $type.slice(1))](this.#byteOffset + $memT.$byteOffset, true);
    }

    // 
    set($name, $member = 0) {
        const $memT = this.#layout.$get($name);
        const $type = this.$expression($name, $memT.$type);
        const $obj = this.get($type);

        // assign members (if struct to struct, will try to recursively)
        if ($type.includes("int64")) { $member = AsBigInt($member); };
        if (typeof $obj == "object") { Object.assign($obj, $member); };

        // TODO! native typed arrays support (detectable by '$type[$n]' expression)...

        // set primitive
        return this.#target["set" + ($type.includes("int64") ? "Big" : "") + ($type.charAt(0).toUpperCase() + $type.slice(1))](this.#byteOffset + $memT.$byteOffset, $member, true);
    }
}
