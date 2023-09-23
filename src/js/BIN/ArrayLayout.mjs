import { Float16Array } from "@petamoriken/float16";
import ArrayView from "./ArrayView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";
import { StructWrap } from "./ProxyHandle.mjs";
import { CStructs, CTypes } from "../Utils/Utils.mjs";

//
export default class ArrayLayout {
    #typed = "uint8";
    #byteLength = 1;
    #classOf = Uint8Array;

    //
    constructor(typed = "uint8", byteLength = 1, classOf = Uint8Array) {
        this.#typed = typed;
        this.#byteLength = byteLength;
        this.#classOf = classOf;

        //
        if (this.#typed) { CStructs.set(this.#typed, this); };
    }

    //
    get $byteLength() { return this.#byteLength; };
    get $typed() { return this.#typed; };
    get $classOf() { return this.#classOf; };

    //
    $view(target, byteOffset = 0, length = 1) { return new ArrayView(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(this.$view(buffer, byteOffset, length), new ProxyHandle(this)); }

    //
    $wrap(buffer, byteOffset = 0, length = 1) {
        //if (buffer instanceof DataView) {
            //return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        //} else
        if (buffer?.buffer && buffer.BYTES_PER_ELEMENT) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        }
        return this.#wrap(buffer, byteOffset, length);
    }

    // 
    $create(objOrLength = 1, length = null) {
        const obj = Array.isArray(length) ? objOrLength : null; length ??= (obj ? obj?.length : objOrLength) || 1;
        const ab = new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)(length * this.#byteLength);
        const px = new Proxy(this.$view(ab, 0, length), new ProxyHandle(this)).$initial;
        //if (obj != null) { Object.assign(px, obj); };
        if (obj != null) { px[0] = obj; }; // use optimized version
        return px;
    }
};

//
export const BigUint64View = StructWrap(new ArrayLayout("uint64", 8, BigUint64Array));
export const BigInt64View = StructWrap(new ArrayLayout("int64", 8, BigInt64Array));
export const Float64View = StructWrap(new ArrayLayout("float64", 8, Float64Array));
export const Uint32View = StructWrap(new ArrayLayout("uint32", 4, Uint32Array));
export const Int32View = StructWrap(new ArrayLayout("int32", 4, Int32Array));
export const Float32View = StructWrap(new ArrayLayout("float32", 4, Float32Array));
export const Uint16View = StructWrap(new ArrayLayout("uint16", 2, Uint16Array));
export const Int16View = StructWrap(new ArrayLayout("int16", 2, Int16Array));
export const Float16View = StructWrap(new ArrayLayout("float16", 2, Float16Array));
export const Uint8View = StructWrap(new ArrayLayout("uint8", 1, Uint8Array));
export const Int8View = StructWrap(new ArrayLayout("int8", 1, Int8Array));
