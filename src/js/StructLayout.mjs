import StructView from "./StructView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";
import StructType from "./StructType.mjs";
import { CStructs, CTypes, AsInt } from "./Utils.mjs";

//
export default class StructLayout {
    #typed = "";
    #layout = {};
    #byteLength = 1;

    //
    constructor(typed, layout = {}, byteLength = 1) {
        this.#layout = layout;
        this.#typed = typed;
        this.#byteLength = byteLength;

        //
        if (this.#typed) { CStructs[this.#typed] = this; };
    }

    //
    get $byteLength() { return this.#byteLength; };
    get $typed() { return this.#typed; }
    get $layout() { return this.#layout; }

    //
    $view(target, byteOffset = 0, length = 1) { return new StructView(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(this.$view(buffer, byteOffset, length), new ProxyHandle(this)); }

    //
    $parse($name) {
        //
        let $array = false;
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
        return new StructType($name, $offset, $array, $default);
    }

    // 
    $typeof($mT) {
        let $array = false;
        let $offset = 0;
        let $default = 0;

        // default type
        let $name = (this.$get($mT) ?? this);

        // make type conversion description
        let $cvt = false;
        if (typeof $mT == "string") {
            if (($mT = $mT.trim()).indexOf(":") >= 0) { 
                [$mT, $cvt ] = $mT.vsplit(":");
                $cvt = $cvt .trim(), $mT = $mT.trim();
            };
        }

        // initial values
        const $P = (typeof $name == "string") ? this.#layout.$parse($name.trim()) : $name;
        if ($P instanceof StructType) {
            $name    = ($P?.$name    || $name), 
            $default = ($P?.$default || $default), 
            $array   = ($P?.$array   || $array);
            $offset  = ($P?.$offset  || $offset);
        };

        // convert type when assign, relative offset
        if (typeof $cvt == "string") {
            const $P = this.$parse($cvt);
            $name    = ($P?.$name    ?? $name), 
            $default = ($P?.$default ?? $default), 
            $array   = ($P?.$array   ?? $array);
            $offset += ($P?.$offset  || 0);
        };

        // is inline array index access
        const $index = parseInt($name) || 0; $name ??= this.#layout;

        // if is "StructType", it should to be already a defined
        return new StructType($name, $offset, $array, $default, $index);
    }

    //
    $get($name) {
        let $cvt = false;
        if (typeof $name == "string") {
            $name = $name.trim();
            if ($name.indexOf(":") >= 0) { 
                [ $name, $cvt ] = $name.vsplit(":");
                $cvt  = $cvt .trim(),
                $name = $name.trim();
            };
        }
        return this.#layout[$name];
    }

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
    get $auto() {
        const layout = {};
        let counter = 0;

        //
        for (const $N in this.#layout) {
            let memT = this.#layout[$N];
            if (typeof memT == "string") { memT = this.$parse(memT); };

            // make C-like aligment
            const EL = (CStructs[memT.$name] || CTypes[memT.$name]).$byteLength || 1;
            const offset = Math.ceil(counter / Math.min(EL, 8)) * Math.min(EL, 8); counter = (offset + EL * (memT.$array || 1));
            layout[$N] = new StructType(memT.$name, offset, memT.$array, memT.$default);
        }

        //
        Object.assign(this.#layout, layout);
        this.#byteLength = counter;

        //
        return new Proxy(function _STRUCT_() {}, new ProxyHandle(this));
    }
};
