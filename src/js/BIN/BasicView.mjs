import ProxyHandle from "./ProxyHandle.mjs";
import { AsBigInt, AsInt, CTypes, CStructs, AddressOf } from "../Utils/Utils.mjs";
import { Float16Array } from "/@petamoriken/float16/browser/float16.mjs";
import ArrayView from "./ArrayView.mjs";
import { ViewUtils } from "./StructType.mjs";

//
export class BasicLayout {
    #typed = "uint8";
    #byteLength = 1;
    #opt = Uint8Array;

    //
    constructor($typed = "uint8", _ = [], $byteLength = 1, $opt = Uint8Array) {
        this.#typed = $typed?.$typed ?? $typed;
        this.#byteLength = $byteLength;
        this.#opt = $opt;

        //
        if (this.#typed) { CTypes.set(this.#typed, this); };
    }

    //
    $view(target, byteOffset = 0, length = false) { return new (!!length ? ArrayView : BasicView)(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = false) { return new Proxy(this.$view(buffer, byteOffset, length), new ProxyHandle(this)); }

    //
    $wrap(buffer, byteOffset = 0, length = false) {
        //if (buffer instanceof DataView) {
            //return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        //} else
        if (buffer?.buffer && buffer?.BYTES_PER_ELEMENT) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        }
        return this.#wrap(buffer, byteOffset, length);
    }

    // 
    $create(objOrLength = 1, length = false) {
        const obj = objOrLength; length ||= obj?.length;
        const ab = new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)((length || objOrLength) * this.#byteLength);
        const px = new Proxy(this.$view(ab, 0, length), new ProxyHandle(this)).$initial;
        if (obj != null) { Object.assign(px, obj); };
        return px;
    }

    //
    get $opt() { return this.#opt; };
    get $typed() { return this.#typed; };
    get $byteLength() { return this.#byteLength; };
};

//
export default class BasicView extends ViewUtils {
    constructor(layout, target, byteOffset = 0, _ = 1) {
        super(layout, target, byteOffset, _);
    }

    //
    get $length() { return 1; };
    get $ownKeys() { return ["*"]; };

    //
    $get($name = "*", $ref = false) {
        return super.$get(0, this.$layout.$typed, $ref);
    }

    // 
    $set($name = "*", $member = 0) {
        return super.$set(0, $member, this.$layout.$typed);
    }
};

//
new BasicLayout("uint8", [], 1, Uint8Array);
new BasicLayout("int8", [], 1, Int8Array);
new BasicLayout("uint16", [], 2, Uint16Array);
new BasicLayout("int16", [], 2, Int16Array);
new BasicLayout("float16", [], 2, Float16Array);
new BasicLayout("uint32", [], 4, Uint32Array);
new BasicLayout("int32", [], 4, Int32Array);
new BasicLayout("float32", [], 4, Float32Array);
new BasicLayout("uint64", [], 8, BigUint64Array);
new BasicLayout("int64", [], 8, BigInt64Array);
new BasicLayout("float64", [], 8, Float64Array);
