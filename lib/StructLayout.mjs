import StructView from "./StructView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";

//
export const CStructs = {};
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
    #wrap(buffer, byteOffset = 0, length = 1) { return new Proxy(new DataView(buffer, byteOffset, this.#byteLength * length), new ProxyHandle(this)); }

    //
    $get($name) {
        let $mT = "", $default = null;
        $mT = $mT.trim(), $name = $name.trim();
        if ($name.indexOf(":") >= 0) { [$name, $mT ] = $name.vsplit(":"); };
        $mT = $mT.trim(), $name = $name.trim();
        if ($mT.indexOf(";") >= 0) { [$mT, $default ] = $mT.vsplit(";"); };
        $mT = $mT.trim(), $default = JSON.parse($default.trim());
        return ($mT ||= this.#layout[$name]);
    }

    //
    $wrap(buffer, byteOffset = 0, length = 1) {
        if (buffer instanceof ArrayBuffer || buffer instanceof SharedArrayBuffer) {
            return this.#wrap(buffer, byteOffset, length);
        } else 
        if (buffer instanceof DataView) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        } else
        if (buffer?.buffer && buffer?.BYTES_PER_ELEMENT) {
            return this.#wrap(buffer.buffer, buffer.byteOffset + byteOffset, length);
        }
        return buffer;
    }

    // TODO! support an structs input
    $create(length = 1) {
        const ab = new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)(length * this.#byteLength);
        return new Proxy(this.$view(new DataView(ab), 0, length), new ProxyHandle(this)).$initial;
    }
};
