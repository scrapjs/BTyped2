import StructProxyHandle from "./StructProxyHandle.mjs";

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
    $expression(name, mT) {
        return mT;
    }

    //
    get(name) {
        const $memT = this.#layout.$get(name);
        const $name = this.$expression(name, $memT.$name);

        // if array index
        if (!isNaN(parseInt($name))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + this.#layout.$byteLength * parseInt($name)), new StructProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$name]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + $memT.$byteOffset), new StructProxyHandle(CStructs[$name]));
        }

        // get value from DataView
        return this.#target["get" + ($name.charAt(0).toUpperCase() + $name.slice(1))](this.#byteOffset + $memT.$byteOffset, true);
    }

    // 
    set(name, number = 0) {
        const $memT = this.#layout.$get(name);
        const $name = this.$expression(name, $memT.$name);
        const $obj = this.get($name);

        // assign members (if struct to struct, will try to recursively)
        if (typeof $obj == "object") {
            Object.assign($obj, number);
        };

        // 
        return this.#target[$memT.$name](this.#byteOffset + $memT.$byteOffset, number, true);
    }
}
