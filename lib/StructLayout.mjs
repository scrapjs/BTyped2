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
    $parse($mT) {
        //
        let $array = false;
        let $offset = 0;
        let $default = 0;

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

        //
        return new StructType($mT, $offset, $array, $default);
    }

    //
    $get($name) {
        let $mT = "", $default = null;
        if (typeof $name == "string") {
            $mT = $mT.trim(), $name = $name.trim();
            if ($name.indexOf(":") >= 0) { [ $name, $mT ] = $name.vsplit(":"); $mT = $mT.trim(), $name = $name.trim(); };
            if ($mT.indexOf(";") >= 0) { [$mT, $default ] = $mT.vsplit(";"); $mT = $mT.trim(), $default = $default ? JSON.parse($default.trim()) : 0; };
        }
        return ($mT ||= this.#layout[$name]);
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
    $auto() {
        const layout = {};
        const counter = 0;

        //
        for (const $N in this.#layout) {
            const memT = this.#layout[$N];
            if (typeof memT == "string") { memT = this.$parse(memT); };

            // make C-like aligment
            const EL = (CStructs[memT.$name] || CTypes[memT.$name]).$byteLength;
            const offset = ((counter / EL) | 0) * EL; counter = (offset + EL * (memT.$array || 1));
            layout[$N] = new StructType(memT.$name, offset, memT.$array, memT.$default);
        }

        //
        Object.assign(this.#layout, layout);

        //
        return new Proxy(function _STRUCT_() {}, new ProxyHandle(this));
    }
};
