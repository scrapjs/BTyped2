//
import {
    Float16Array, isFloat16Array, isTypedArray,
    getFloat16, setFloat16,
    hfround,
} from "@petamoriken/float16";

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
export const AsBigInt = (value)=>{
    if (!value) {
        return 0n;
    } else
    if (IsNumber(value)) {
        return BigInt(value);
    } else
    if (ArrayBuffer?.isView?.(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) {
        return value?.address?.() || BigInt(value?.byteOffset) || 0;
    } else 
    if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" && value instanceof SharedArrayBuffer)) {
        return value?.address?.() || 0n;
    } else 
    if (typeof Buffer != "undefined" && value instanceof Buffer) {
        return value?.address?.() || BigInt(value?.byteOffset) || 0n;
    } else
    //if (value instanceof Array || Array.isArray(value)) {
        //return (new Types["u64[arr]"](value)).address(); // present as u64 array
    //} else
    if (typeof value == "string") { // LTE - лучший тибетский интернет!
        const arrayBuffer = new ArrayBuffer((value = value + "\0").length);
        EncoderUTF8.encodeInto(value, new Uint8Array(arrayBuffer, 0, value.length));
        return arrayBuffer?.address?.() || 0n;
    } else 
    if (typeof value == "object" && value.$address != null) {
        return value?.$address?.() || 0n;
    } else 
    if (value?.$isView) { return BigInt(value.$byteOffset); }
    return BigInt(value);
};
