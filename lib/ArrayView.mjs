import ArrayLayout from "./ArrayLayout.mjs";
import { CTypes } from "./ArrayLayout.mjs";
import { AsBigInt, AsInt } from "./Utils.mjs";

//
new ArrayLayout("uint64", 8);
new ArrayLayout("int64", 8);
new ArrayLayout("float64", 8);
new ArrayLayout("uint32", 4);
new ArrayLayout("int32", 4);
new ArrayLayout("float32", 4);
new ArrayLayout("uint16", 2);
new ArrayLayout("int16", 2);
new ArrayLayout("float16", 2);
new ArrayLayout("uint8", 1);
new ArrayLayout("int8", 1);

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
        this.#typed = typed;
    }

    //
    get $byteLength() { return (this.$length * CTypes[this.#typed].$byteLength); };
    get $byteOffset() { return this.#byteOffset; };
    get $length() { return this.#length; };

    //
    $get($index) {
        $index = parseInt($index);
        const $name = this.#typed;
        const $memT = CTypes[this.#typed];

        // get primitive
        return this.#target["get" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, true);
    }

    // 
    $set($index, $member = 0) {
        $index = parseInt($index);
        const $name = this.#typed;
        const $memT = CTypes[this.#typed];

        // assign members (if struct to struct, will try to recursively)
        if ($name.includes("int64")) { $member = AsBigInt($member); }
        if ($name.includes("int32")) { $member = AsInt($member); }

        // set primitive
        { this.#target["set" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, $member, true); };
        return true;
    }
};
