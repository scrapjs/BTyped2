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
    get(name) {
        const $mem = this.#layout.$get(name);

        // if array index
        if (!isNaN(parseInt(name))) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + this.#layout.$byteLength * parseInt(name)), new StructProxyHandle(this.#layout));
        }

        // if structure member
        if (CStructs[$mem.$name]) {
            return new Proxy(new DataView(this.#target.buffer, this.#byteOffset + this.#target.byteOffset + $mem.$byteOffset), new StructProxyHandle(CStructs[$mem.$name]));
        }

        // get value from DataView
        return this.#target[$mem.$name](this.#byteOffset + $mem.$byteOffset, false);
    }

    //
    set(name, number = 0) {
        const $mem = this.#layout.$get(name);

        // TODO: assign whole structure
        return this.#target[$mem.$name](this.#byteOffset + $mem.$byteOffset, number, false);
    }
}
