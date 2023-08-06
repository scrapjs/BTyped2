import ProxyHandle from "./ProxyHandle.mjs";
import { AsBigInt, AsInt, CTypes, CStructs } from "./Utils.mjs";

//
export default class StructView {
    $target = null;
    #layout = null;
    #byteOffset = 0;
    #length = 1;

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        this.#layout = (typeof layout == "string") ? CStructs[layout] : layout;

        //
        Object.defineProperty(this, '$target', { get: typeof target == "function" ? target : ()=>target });

        //
        this.#byteOffset = byteOffset;
        this.#length = length;
    }

    //
    get $isView() { return true; };
    get $length() { return this.#length; };
    get $byteOffset() { return this.#byteOffset; };
    get $byteLength() { return (this.$length * this.#layout.$byteLength); };
    get $ownKeys() { return [...Object.keys(this.#layout.$layout), ...Array.from({length: this.#length}, (_, i) => i)]; };
    get $layout() { return this.#layout; };
    get $buffer() { return (this.$target?.buffer || this.$target); };

    //
    $has($name) { return ($name in this.#layout.$layout); };

    // 
    $typeof($name, $mT) {
        $mT ??= $name;

        //
        let $array = false;
        let $offset = 0;
        let $default = 0;

        //
        if (typeof $mT == "string") {
            $mT = $mT.trim();

            //
            if (typeof $name == "string") {
                $name = $name.trim();
                if ($name?.indexOf?.(":") >= 0) { [$name, $mT ] = $name.vsplit(":"); $mT = $mT.trim(), $name = $name.trim(); };
            }

            //
            if ($mT?.indexOf?.(";") >= 0) { [$mT, $default ] = $mT.vsplit(";"); $mT = $mT.trim(), $default = $default ? JSON.parse($default.trim()) : 0; };
            
            // 
            if ($mT.indexOf?.("[") >= 0 && $mT.indexOf?.("]") >= 0) {
                let $match = $mT.match(/\[(-?\d+)\]/);
                $array = ($match ? AsInt($match[1]) : 1) || 1;
                $mT = $mT.replace(/\[\d+\]/g, "");
            };

            // 
            if ($mT.indexOf?.("(") >= 0 && $mT.indexOf?.(")") >= 0) {
                let $match = $mT.match(/\((-?\d+)\)/);
                $offset = ($match ? AsInt($match[1]) : 0) || 0;
                $mT = $mT.replace(/\(\d+\)/g, "");
            };
        }

        // if is "StructType", it should to be already a defined
        return (typeof $mT == "object" ? $mT : {
            $index: parseInt($mT) || 0,
            $name: (typeof $mT == "number" && !isNaN(parseInt($mT))) ? this.#layout : ($mT ?? this.#layout),
            $array, $offset,
            $default
        });
    }

    //
    get $initial() {
        this.$ownKeys.forEach(($e)=>{
            this.$set($e, this.$typeof($e, this.#layout.$get($e)).$default);
        });
        return this;
    }

    //
    $get($name) {
        const $type = this.$typeof($name, this.#layout.$get($name));
        const $index = $type.$index;

        // getting an member type
        let $T = $type.$name;
        if (CStructs[$type.$name]) { $T = CStructs[$type.$name]; };
        if (CTypes[$type.$name] && $type.$array) { $T = CTypes[$type.$name]; };

        // an-struct or arrays
        if (typeof $T == "object") {
            return new Proxy($T.$view(this.$target, (this.#layout.$byteLength * $index) + (this.#byteOffset + $type.$offset), ($type.$array || 1)), new ProxyHandle($T));
        }

        // get primitive
        const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
        const $getter = "get" + ($type.$name?.includes?.("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1));

        //
        if ($target[$getter]) { return $target[$getter](this.#byteOffset + $type.$offset, true); }

        //
        return 0;
    }

    // 
    $set($name, $member = 0) {
        const $type = this.$typeof($name, this.#layout.$get($name));
        const $obj = this.$get($name);

        // assign members (if struct to struct, will try to recursively)
        if ($type.$name?.includes?.("int64")) { $member = AsBigInt($member); }
        if ($type.$name?.includes?.("int32")) { $member = AsInt($member); }

        //
        if (typeof $obj == "object" && typeof $member == "object") 
            { Object.assign($obj, $member); return true; }

        // set primitive
        if ((typeof $type.$name == "string") && (typeof $member == "number" || typeof $member == "bigint")) 
        {
            const $target = (this.$target instanceof DataView) ? this.$target : new DataView(this.$target, 0);
            const $setter = "set" + ($type.$name.includes("int64") ? "Big" : "") + ($type.$name.charAt(0).toUpperCase() + $type.$name.slice(1));

            //
            if ($target[$setter]) { $target[$setter](this.#byteOffset + $type.$offset, $member, true); }
        };

        //
        return true;
    }
};
