import { CStructs, CTypes, AsInt } from "../Utils/Utils.mjs";
import ProxyHandle from "./ProxyHandle.mjs";

//
export default class StructType {
    #name = "uint8";
    #offset = 0;
    #array = null;
    #default = 0;
    #index = 0;

    //
    static $parse($name) {
        let $array = null;
        let $offset = 0;
        let $default = 0;

        //
        if ($name?.indexOf?.(";") >= 0) { [$name, $default ] = $name.vsplit(";"); $name = $name.trim(), $default = $default ? JSON.parse($default.trim()) : 0; };

        // 
        if ($name.indexOf?.("[") >= 0 && $name.indexOf?.("]") >= 0) {
            let $match = $name.match(/\[(-?\d+)\]/);
            $array = ($match ? AsInt($match[1]) : 1) || 1;
            $name = $name.replace(/\[\d+\]/g, "");
        };

        // 
        if ($name.indexOf?.("(") >= 0 && $name.indexOf?.(")") >= 0) {
            let $match = $name.match(/\((-?\d+)\)/);
            $offset = ($match ? AsInt($match[1]) : 0) || 0;
            $name = $name.replace(/\(\d+\)/g, "");
        };

        //
        return new StructType($name, $offset, $array, $default, 0);
    }

    //
    constructor($name = "uint8", $offset = 0, $array = null, $default = 0, $index = 0) {
        this.#name = ($name instanceof StructType ? $name.$name : $name);
        this.#offset = $offset;
        this.#array = $array;
        this.#default = $default;
        this.#index = $index;
    }

    //
    get $offset() { return this.#offset; };
    get $name() { return this.#name; };
    get $array() { return this.#array; };
    get $default() { return this.#default; };
    get $index() { return this.#index; };
};

//
export class ViewUtils {
    $target = null;
    $layout = null;
    $byteOffset = 0;
    $length = 1;

    //
    constructor(layout, target, byteOffset = 0, $length = 1) {
        this.$layout = (typeof layout == "string") ? CTypes.get(layout) : layout;
        this.$byteOffset = byteOffset;
        this.$length = $length;

        //
        Object.defineProperty(this, '$target', { get: typeof target == "function" ? target : ()=>target });
    }

    //
    get $address() { return (AddressOf(this.$target) || BigInt(this.$target.byteOffset) || 0n) + BigInt(this.$byteOffset); };
    get $isView() { return true; };
    get $buffer() { return (this.$target?.buffer || this.$target); };

    // sort of legacy...
    $select($offset = 0, $length = 1) {
        return new this.$layout.$opt(this.$buffer, $offset + this.$byteOffset + (this.$target?.byteOffset || 0), Math.min($length, this.$length - ($offset/this.$layout.$byteLength)));
    }

    //
    $ref($offset = 0, $T, $ref = false, $length = null) {

        // getting an member type
        if ((typeof $T == "string") && (CTypes.has($T) ?? CStructs.has($T))) { $T = CTypes.get($T) ?? CStructs.get($T); };

        // an-struct or arrays
        const $opt = $T?.$opt;
        if (!$ref && $length != null) { $T = $T?.$opt ?? $T; };
        if ($T == $opt) { // faster version, optimal
            return new ($opt)(this.$target, $offset + this.$byteOffset, /* in theory, possible array of arrays */ $length);
        }
        if (typeof $T == "object") {
            const ref = new Proxy($T.$view(this.$target, $offset + this.$byteOffset, /* in theory, possible array of arrays */ $length ?? 1, $length != null), new ProxyHandle($T));
            return !$ref && ($T != this.$layout) ? ref["*"] : ref;
        }
    }

    //
    $get($offset = 0, $T = null, $ref = false) {
        // getting an member type
        $T ??= this.$layout.$typed;
        if (typeof $T == "string") {
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            const $getter = "get" + ($T.includes?.("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

            //
            if ($target[$getter]) { return $target[$getter](this.$byteOffset + $offset, true); }
        }
        //
        return null;
    }

    // 
    $set($offset = 0, $member = 0, $T = null, $length = null) {
        $T ??= this.$layout.$typed;
        const $obj = this.$ref($offset, $T, true, $length);

        // optimized operation for array-view
        if ((Array.isArray($member) || ArrayBuffer.isView($member)) && typeof $obj?.$select == "function") {
            $obj["*"].set($member); return true;
        }

        //
        if (typeof $obj == "object" && typeof $member == "object") { 
            Object.assign($obj, $member); return true;
        }

        //
        if (typeof $member == "number" || typeof $member == "bigint")
        {   // set primitive
            if (typeof $T == "string" || $T == "*") {
                const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
                const $setter = "set" + ($T.includes("int64") ? "Big" : "") + ($T.charAt(0).toUpperCase() + $T.slice(1));

                //
                if ($T?.includes?.("int64")) { $member = AsBigInt($member); }
                if ($T?.includes?.("int32")) { $member = AsInt($member); }
                if ($target[$setter]) { $target[$setter](this.$byteOffset + $offset, $member, true); }
            } else {
                // better mode
                $obj["*"] = $member;
            }
        };

        //
        return true;
    }
};
