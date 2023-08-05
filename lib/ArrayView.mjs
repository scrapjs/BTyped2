import ArrayLayout from "./ArrayLayout.mjs";
import { StructWrap } from "./lib/ProxyHandle.mjs";
import { CTypes } from "./ArrayLayout.mjs";
import { AsBigInt, AsInt } from "./Utils.mjs";

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

//
export default class ArrayView {
    #target = null;
    #length = null;
    #typed = "uint8";
    #byteOffset = 0;

    //
    constructor(typed, target, byteOffset = 0, length = 1) {
        this.#length = length;
        this.#target = target;
        this.#byteOffset = byteOffset;
        this.#typed = (typeof this.#typed == "string") ? CTypes[this.#typed] : this.#typed;
    }

    //
    get $isView() { return true; };
    get $ownKeys() { return Array.from({length: this.#length}, (_, i) => i); };
    get $byteLength() { return (this.$length * this.#typed.$byteLength); };
    get $byteOffset() { return this.#byteOffset; };
    get $length() { return this.#length; };
    get $buffer() { return (this.#target?.buffer || this.#target); };

    //
    $has($name) { return (this.#length > $name && $name >= 0); };

    //
    $get($index) {
        $index = parseInt($index);
        const $name = this.#typed.$typed;
        const $memT = this.#typed;

        // get primitive
        return this.#target["get" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, true);
    }

    // 
    $set($index, $member = 0) {
        $index = parseInt($index);
        const $name = this.#typed.$typed;
        const $memT = this.#typed;

        // assign members (if struct to struct, will try to recursively)
        if ($name.includes("int64")) { $member = AsBigInt($member); }
        if ($name.includes("int32")) { $member = AsInt($member); }

        // set primitive
        { this.#target["set" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, $member, true); };
        return true;
    }
};
