//
import {
    Float16Array, isFloat16Array, isTypedArray,
    getFloat16, setFloat16,
    hfround, f16round,
} from "@petamoriken/float16";

//
DataView.prototype.getFloat16 = function (...$args) { return getFloat16(this, ...$args); };
DataView.prototype.setFloat16 = function (...$args) { return setFloat16(this, ...$args); };
Math.hfround = hfround;
Math.f16round = f16round;

// avoid limitation
const _isView_ = ArrayBuffer.isView;
ArrayBuffer.isView = function(...$args) {
    return (isFloat16Array(...$args) || _isView_.apply(this, $args));
}

//
export const IsAbv = (value) => {
    return value && value.byteLength != undefined && (value instanceof ArrayBuffer);
}

//
export const IsNumber = (index) => {
    return typeof index == "number" || typeof index == "bigint" || Number.isInteger(index) || typeof index == "string" && index.trim() != "" && /^\+?\d+$/.test(index.trim());
}

//
export const AsInt = (value) => {
    if (ArrayBuffer?.isView?.(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) { return value?.byteOffset || 0; }
    if (value?.$isView) { return value.$byteOffset; }
    return IsNumber(value) ? parseInt(value) : 0;
}

//
export const AsFloat = (index) => {
    return IsNumber(index) ? parseFloat(index) : 0;
}

//
export const EncoderUTF8 = new TextEncoder(); //U8Cache

//
String.prototype.vsplit = function(symbol){
    if (this != "") {
        return (this.startsWith(symbol) ? ["", ...this.substring(1).vsplit()] : this.split(symbol))||[this];
    }
    return [this];
};

//
export const AddressOf = (obj)=>{
    return (typeof obj?.address == "function" ? obj?.address?.() : obj?.address) || 0n;
}

//
export const AsBigInt = (value)=>{
    if (!value) {
        return 0n;
    } else
    if (IsNumber(value)) {
        return BigInt(value);
    } else
    if (ArrayBuffer?.isView?.(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) {
        return AddressOf(value) || BigInt(value?.byteOffset) || 0;
    } else 
    if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" && value instanceof SharedArrayBuffer)) {
        return AddressOf(value);
    } else 
    if (typeof Buffer != "undefined" && value instanceof Buffer) {
        return AddressOf(value) || BigInt(value?.byteOffset) || 0n;
    } else
    //if (value instanceof Array || Array.isArray(value)) {
        //return (new Types["u64[arr]"](value)).address(); // present as u64 array
    //} else
    if (typeof value == "string") { // LTE - лучший тибетский интернет!
        const arrayBuffer = new ArrayBuffer((value = value + "\0").length);
        EncoderUTF8.encodeInto(value, new Uint8Array(arrayBuffer, 0, value.length));
        return AddressOf(arrayBuffer);
    } else 
    if (value?.$isView) { return BigInt(value?.$address) || BigInt(value?.$byteOffset) || 0n; } else
    if (typeof value == "object") { return AddressOf(value); }
    return BigInt(value);
};

//
export const CTypes = {};
export const CStructs = {};