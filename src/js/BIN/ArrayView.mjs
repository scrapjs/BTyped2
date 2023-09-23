import { AsBigInt, AsInt, CTypes, CStructs, AddressOf } from "../Utils/Utils.mjs";

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
    $get($name, $ref = false) {
        const $index = parseInt($name) || 0;

        // getting an member type
        let $T = this.#layout?.$typed ?? this.#layout;
        if ($T == "*" && !$ref) { $T = this.#layout?.$opt ?? this.#layout; };
        if ((typeof $T == "string") && (CTypes.has($T) ?? CStructs.has($T))) { $T = CTypes.get($T) ?? CStructs.get($T); };

        // an-struct or arrays
        if (typeof $T == "object") {
            if ($T == this.#layout?.$opt) { // faster version, optimal
                return new (this.#layout?.$opt)(this.$target, (this.#layout.$byteLength * $index) + this.#byteOffset, /* in theory, possible array of arrays */ this.$length);
            }
            const ref = new Proxy($T.$view(this.$target, (this.#layout.$byteLength * $index) + this.#byteOffset, /* in theory, possible array of arrays */ 1, false), new ProxyHandle($T));
            return $ref && ($T != this.#layout) ? ref["*"] : ref;
        }

        {   // get primitive (legacy)
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            const $getter = "get" + ($T.includes?.("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));
            if ($target[$getter]) { return $target[$getter]($index * $memT.$byteLength + this.#byteOffset, true); }
        }
    }

    // sort of legacy...
    $select($index = 0, $length = 1) {
        return new this.#layout.$opt(this.$buffer, $index * this.#layout.$byteLength + this.#byteOffset + (this.$target?.byteOffset || 0), Math.min($length, this.$length - $index));
    }

    // 
    $set($name = "*", $member = 0) {
        const $obj = this.$get($name, true);
        const $index = parseInt($name);

        // assign members (if struct to struct, will try to recursively)
        const $T = this.#layout?.$typed ?? this.#layout;

        // optimized operation for array-view
        if ((Array.isArray($member) || ArrayBuffer.isView($member)) && typeof $obj?.$select == "function") { 
            $obj["*"].set($member); return true;
        }

        //
        if (typeof $obj == "object" && typeof $member == "object") { 
            Object.assign($obj, $member); return true;
        }

        // set primitive
        if (typeof $member == "number" || typeof $member == "bigint")
        {
            if (typeof $T == "string") {
                // legacy mode
                const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
                const $setter = "set" + ($T.includes("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

                //
                if ($T?.includes?.("int64")) { $member = AsBigInt($member); }
                if ($T?.includes?.("int32")) { $member = AsInt($member); }
                if ($target[$setter]) { $target[$setter](this.#byteOffset + $index, $member, true); }
            } else {
                // better mode
                $obj["*"] = $member;
            }
        };

        //
        return true;
    }
};
