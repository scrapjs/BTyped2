import ArrayView from "./ArrayView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";

//
export const CTypes = {};
export default class ArrayLayout {
    #typed = "";
    #byteLength = 1;

    //
    constructor(typed, byteLength = 1) {
        this.#typed = typed;
        this.#byteLength = byteLength;

        //
        if (this.#typed) { CTypes[this.#typed] = this; };
    }

    //
    get $byteLength() { return this.#byteLength; };
    get $typed() { return this.#typed; };

    //
    $view(target, byteOffset = 0, length = 1) { return new ArrayView(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(new DataView(buffer, byteOffset, this.#byteLength * length), new ProxyHandle(this)); }

    //
    wrap(buffer, byteOffset = 0, length = 1) {
        if (buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer) {
            return this.#wrap(buffer, byteOffset, length);
        } else 
        if (buffer instanceof DataView) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        } else
        if (buffer?.buffer && buffer.BYTES_PER_ELEMENT) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        }
    }
};
