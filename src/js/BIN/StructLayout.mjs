import StructView from "./StructView.mjs";
import ArrayView from "./ArrayView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";
import StructType from "./StructType.mjs";
import { CStructs, CTypes, AsInt } from "../Utils/Utils.mjs";

//
export default class StructLayout {
    #typed = "";
    #layout = new Map([]);
    #byteLength = 1;

    //
    constructor(typed, layout = [], byteLength = 1) {
        this.#layout = new Map(layout);
        this.#typed = typed;
        this.#byteLength = byteLength;

        //
        if (this.#typed) { CStructs.set(this.#typed, this); };
    }

    //
    get $byteLength() { return this.#byteLength; };
    get $typed() { return this.#typed; }
    get $layout() { return this.#layout; }

    //
    $view(target, byteOffset = 0, length = 1, array = false) { return new (array ? ArrayView : StructView)(this, target, byteOffset, length); }
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(this.$view(buffer, byteOffset, length), new ProxyHandle(this)); }

    // $fn - field name
    $typeof($fn) {
        let $array = false, $offset = 0, $default = 0, $name = "", $cvt = false;

        // make type conversion description
        if (typeof $fn == "string" && ($fn = $fn.trim()).indexOf(":") >= 0) {
            [ $fn, $cvt ] = $fn.vsplit(":");
            $cvt = $cvt .trim(), $fn = $fn.trim();
        }

        // initial values
        const $T = (this.#layout.get($fn) ?? this);
        const $P = (typeof $T == "string") ? StructType.$parse($T.trim()) : $T;
        if ($P instanceof StructType) {
            $name    = ($P?.$name    || $name), 
            $default = ($P?.$default || $default), 
            $array   = ($P?.$array   || $array);
            $offset  = ($P?.$offset  || $offset);
        };

        // convert type when assign, relative offset
        if (typeof $name == "string") { $name = $name.trim(); };
        if (typeof $cvt == "string") {
            const $P = StructType.$parse($cvt);
            $name    = ($P?.$name    ?? $name), 
            $default = ($P?.$default ?? $default), 
            $array   = ($P?.$array   ?? $array);
            $offset += ($P?.$offset  || 0);
        };

        // if is "StructType", it should to be already a defined
        if (typeof $name == "string") { $name = $name.trim(); };
        return new StructType($name || $T, $offset, $array, $default, parseInt($fn) || 0);
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
        let counter = 0;

        //
        for (const $N of this.#layout.keys()) {
            let memT = this.#layout.get($N);
            if (typeof memT == "string") { memT = StructType.$parse(memT); };

            // make C-like aligment
            const EL = (CStructs.get(memT.$name) || CTypes.get(memT.$name)).$byteLength || 1;
            const offset = Math.ceil(counter / Math.min(EL, 8)) * Math.min(EL, 8); counter = (offset + EL * (memT.$array || 1));
            this.#layout.set($N, new StructType(memT.$name, offset, memT.$array, memT.$default));
        }

        //
        this.#byteLength = counter;

        //
        return new Proxy(function _STRUCT_() {}, new ProxyHandle(this));
    }
};
