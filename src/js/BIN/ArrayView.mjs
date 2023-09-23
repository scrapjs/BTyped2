import { AsBigInt, AsInt, CTypes, AddressOf } from "../Utils/Utils.mjs";

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
        this.#layout = (typeof layout == "string") ? CStructs.get(layout) : layout;
    }

    //
    get $isView() { return true; };
    get $ownKeys() { return Array.from({length: this.#length}, (_, i) => i); };
    get $byteLength() { return (this.$length * this.#layout.$byteLength); };
    get $byteOffset() { return this.#byteOffset; };
    get $length() { return this.#length; };
    get $buffer() { return (this.$target?.buffer || this.$target); };
    get $address() { return (AddressOf(this.$target) || BigInt(this.$target.byteOffset) || 0n) + BigInt(this.$byteOffset); };

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
    $select($index = 0, $length = 1) {
        return new this.#layout.$classOf(this.$buffer, $index * this.#layout.$byteLength + this.#byteOffset + (this.$target?.byteOffset || 0), Math.min($length, this.$length - $index));
    }

    // 
    $set($index = 0, $member = 0) {
        //
        $index = parseInt($index);
        const $name = this.#layout.$typed;
        const $memT = this.#layout;

        // optimized operation
        if (Array.isArray($member) || ArrayBuffer.isView($member)) {
            this.$select($index, $member.length).set($member);
            return true;
        }

        // assign members (if struct to struct, will try to recursively)
        if ($name?.includes?.("int64")) { $member = AsBigInt($member); }
        if ($name?.includes?.("int32")) { $member = AsInt($member); }

        // set primitive
        {
            if ($name.includes("int64")) { $member = BigInt($member); };
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            $target["set" + ($name.includes("int64") ? "Big" : "") + ($name.charAt(0).toUpperCase() + $name.slice(1))]($index * $memT.$byteLength + this.#byteOffset, $member, true); 
        };
        return true;
    }
};
