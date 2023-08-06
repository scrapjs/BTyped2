import ProxyHandle from "./ProxyHandle.mjs";
import { AsBigInt, AsInt, CTypes, CStructs, AddressOf } from "./Utils.mjs";

//
export default class StructView {
    $target = null;
    #layout = null;
    #byteOffset = 0;
    #length = 1;

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        this.#layout = (typeof layout == "string") ? CStructs[layout] : layout;
        this.#byteOffset = byteOffset;
        this.#length = length;

        //
        Object.defineProperty(this, '$target', { get: typeof target == "function" ? target : ()=>target });
    }

    //
    get $isView() { return true; };
    get $length() { return this.#length; };
    get $byteOffset() { return this.#byteOffset; };
    get $byteLength() { return (this.$length * this.#layout.$byteLength); };
    get $ownKeys() { return [...Object.keys(this.#layout.$layout), ...Array.from({length: this.#length}, (_, i) => i)]; };
    get $layout() { return this.#layout; };
    get $buffer() { return (this.$target?.buffer || this.$target); };
    get $address() { return (AddressOf(this.$target) || BigInt(this.$target.byteOffset) || 0n) + BigInt(this.$byteOffset); };
    get $initial() {
        this.$ownKeys.forEach(($e)=>{
            this.$set($e, this.#layout.$typeof($e).$default);
        });
        return this;
    }

    //
    $has($name) { return ($name in this.#layout.$layout); };
    $get($name) {
        const $type = this.#layout.$typeof($name);
        const $index = $type.$index;

        // getting an member type
        let $T = $type.$name;
        if ((typeof $T == "string") && (CStructs[$T] || (CTypes[$T] && $type.$array))) { $T = (CStructs[$T] || CTypes[$T]); };

        // an-struct or arrays
        if (typeof $T == "object") {
            return new Proxy($T.$view(this.$target, (this.#layout.$byteLength * $index) + (this.#byteOffset + $type.$offset), ($type.$array || 1)), new ProxyHandle($T));
        }

        // get primitive
        const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
        const $getter = "get" + ($T.includes?.("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

        //
        if ($target[$getter]) { return $target[$getter](this.#byteOffset + $type.$offset, true); }

        //
        return 0;
    }

    // 
    $set($name, $member = 0) {
        const $type = this.#layout.$typeof($name);
        const $obj = this.$get($name);

        // assign members (if struct to struct, will try to recursively)
        const $T = $type.$name;
        if (typeof $obj == "object" && typeof $member == "object") { Object.assign($obj, $member); return true; }

        // set primitive
        if ((typeof $T == "string") && (typeof $member == "number" || typeof $member == "bigint")) 
        {
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            const $setter = "set" + ($T.includes("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

            //
            if ($T?.includes?.("int64")) { $member = AsBigInt($member); }
            if ($T?.includes?.("int32")) { $member = AsInt($member); }
            if ($target[$setter]) { $target[$setter](this.#byteOffset + $type.$offset, $member, true); }
        };

        //
        return true;
    }
};
