import { AsBigInt, AsInt, CTypes } from "./Utils.mjs";

//
export default class ArrayView {
    $target = null;
    #length = null;
    #layout = "uint8";
    #byteOffset = 0;

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        this.#length = length;

        //
        Object.defineProperty(this, '$target', { get: typeof target == "function" ? target : ()=>target });

        //
        this.#byteOffset = byteOffset;
        this.#layout = (typeof layout == "string") ? CTypes[layout] : layout;
    }

    //
    get $isView() { return true; };
    get $ownKeys() { return Array.from({length: this.#length}, (_, i) => i); };
    get $byteLength() { return (this.$length * this.#layout.$byteLength); };
    get $byteOffset() { return this.#byteOffset; };
    get $length() { return this.#length; };
    get $buffer() { return (this.$target?.buffer || this.$target); };

    // TODO! Default values for array views
    get $initial() { return this; };

    //
    $has($name) { return (this.#length > $name && $name >= 0); };

    //
    $get($index) {
        $index = parseInt($index);
        const $name = this.#layout.$typed;
        const $memT = this.#layout;

        // get primitive
        const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
        return $target["get" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, true);
    }

    // 
    $set($index, $member = 0) {
        $index = parseInt($index);
        const $name = this.#layout.$typed;
        const $memT = this.#layout;

        // assign members (if struct to struct, will try to recursively)
        if ($name?.includes?.("int64")) { $member = AsBigInt($member); }
        if ($name?.includes?.("int32")) { $member = AsInt($member); }

        // set primitive
        {
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            $target["set" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, $member, true); 
        };
        return true;
    }
};
