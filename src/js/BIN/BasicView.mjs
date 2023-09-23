import ProxyHandle from "./ProxyHandle.mjs";
import { AsBigInt, AsInt, CTypes, AddressOf } from "../Utils/Utils.mjs";
import { Float16Array } from "/@petamoriken/float16";

//
export class BasicLayout {
    #typed = "uint8";
    #byteLength = 1;
    #opt = Uint8Array;

    //
    constructor($typed = "uint8", $byteLength = 1, $opt = Uint8Array) {
        this.#typed = $name.$typed ?? $typed;
        this.#byteLength = $byteLength;
        this.#opt = $opt;

        //
        if (this.#typed) { CTypes.set(this.#typed, this); };
    }

    //
    $view(target, byteOffset = 0, length = 1) { return new BasicView(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(this.$view(buffer, byteOffset, length), new ProxyHandle(this)); }

    //
    $wrap(buffer, byteOffset = 0, length = 1) {
        //if (buffer instanceof DataView) {
            //return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        //} else
        if (buffer?.buffer && buffer?.BYTES_PER_ELEMENT) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        }
        return this.#wrap(buffer, byteOffset, length);
    }

    // 
    $create(objOrLength = 1, length = null) {
        const obj = typeof objOrLength == "object" ? objOrLength : null; length ??= (obj ? 1 : objOrLength);
        const ab = new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)(length * this.#byteLength);
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
export default class BasicView {
    $target = null;
    #layout = null;
    #byteOffset = 0;
    #length = 1;

    //
    constructor(layout, target, byteOffset = 0, _ = 1) {
        this.#layout = (typeof layout == "string") ? CTypes.get(layout) : layout;
        this.#byteOffset = byteOffset;
        this.#length = _;

        //
        Object.defineProperty(this, '$target', { get: typeof target == "function" ? target : ()=>target });
    }

    //
    get $isView() { return true; };
    get $length() { return 1; };
    get $byteOffset() { return this.#byteOffset; };
    get $byteLength() { return (this.#layout.$byteLength); };
    get $ownKeys() { return ["*"]; };
    get $layout() { return this.#layout; };
    get $buffer() { return (this.$target?.buffer || this.$target); };
    get $address() { return (AddressOf(this.$target) || BigInt(this.$target.byteOffset) || 0n) + BigInt(this.$byteOffset); };

    //
    $get(_ = "*") {
        // getting an member type
        const $T = this.#layout.$typed;
        const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
        const $getter = "get" + ($T.includes?.("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

        //
        if ($target[$getter]) { return $target[$getter](this.#byteOffset, true); }

        //
        return null;
    }

    // 
    $set(_ = "*", $member = 0) {
        const $T = this.#layout.$typed;
        const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
        const $setter = "set" + ($T.includes("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

        //
        if ($T?.includes?.("int64")) { $member = AsBigInt($member); }
        if ($T?.includes?.("int32")) { $member = AsInt($member); }
        if ($target[$setter]) { $target[$setter](this.#byteOffset, $member, true); }

        //
        return true;
    }
};

//
new BasicLayout("uint8", 1, Uint8Array);
new BasicLayout("int8", 1, Int8Array);
new BasicLayout("uint16", 2, Uint16Array);
new BasicLayout("int16", 2, Int16Array);
new BasicLayout("float16", 2, Float16Array);
new BasicLayout("uint32", 4, Uint32Array);
new BasicLayout("int32", 4, Int32Array);
new BasicLayout("float32", 4, Float32Array);
new BasicLayout("uint64", 8, BigUint64Array);
new BasicLayout("int64", 8, BigInt64Array);
new BasicLayout("float64", 8, Float64Array);
