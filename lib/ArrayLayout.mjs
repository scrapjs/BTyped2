import ArrayView from "./ArrayView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";
import { StructWrap } from "./ProxyHandle.mjs";
import { CTypes } from "./Utils.mjs";

//
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
    $wrap(buffer, byteOffset = 0, length = 1) {
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

    // 
    $create(objOrLength = 1, length = null) {
        const obj = Array.isArray(length) ? objOrLength : null; length ??= (obj ? 1 : objOrLength);
        const ab = new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)(length * this.#byteLength);
        const px = new Proxy(this.$view(new DataView(ab), 0, length), new ProxyHandle(this)).$initial;
        if (obj != null) { Object.assign(px, obj); };
        return px;
    }
};

//
export const BigUint64View = StructWrap(new ArrayLayout("uint64", 8));
export const BigInt64View = StructWrap(new ArrayLayout("int64", 8));
export const Float64View = StructWrap(new ArrayLayout("float64", 8));
export const Uint32View = StructWrap(new ArrayLayout("uint32", 4));
export const Int32View = StructWrap(new ArrayLayout("int32", 4));
export const Float32View = StructWrap(new ArrayLayout("float32", 4));
export const Uint16View = StructWrap(new ArrayLayout("uint16", 2));
export const Int16View = StructWrap(new ArrayLayout("int16", 2));
export const Float16View = StructWrap(new ArrayLayout("float16", 2));
export const Uint8View = StructWrap(new ArrayLayout("uint8", 1));
export const Int8View = StructWrap(new ArrayLayout("int8", 1));
