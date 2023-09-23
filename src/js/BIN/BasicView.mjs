import ProxyHandle from "./ProxyHandle.mjs";
import { AsBigInt, AsInt, CTypes, CStructs, AddressOf } from "../Utils/Utils.mjs";

//
export class BasicLayout {
    #typed = "uint8";
    #byteLength = 1;

    //
    constructor($typed = "uint8", $byteLength = 1) {
        this.#typed = $name.$typed ?? $typed;
        this.#byteLength = $byteLength;

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
new BasicLayout("uint8", 1);
new BasicLayout("int8", 1);
new BasicLayout("uint16", 2);
new BasicLayout("int16", 2);
new BasicLayout("float16", 2);
new BasicLayout("uint32", 4);
new BasicLayout("int32", 4);
new BasicLayout("float32", 4);
new BasicLayout("uint64", 8);
new BasicLayout("int64", 8);
new BasicLayout("float64", 8);
