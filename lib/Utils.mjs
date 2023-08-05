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
export const AsInt = (index) => {
    return IsNumber(index) ? parseInt(index) : 0;
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
export const CStructs = {};
export const AsBigInt = (value)=>{
    if (!value) {
        return 0n;
    } else
    if (IsNumber(value)) {
        return BigInt(value);
    } else
    if (ArrayBuffer?.isView(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) {
        return value?.address?.() || value?.byteOffset || 0;
    } else 
    if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" && value instanceof SharedArrayBuffer)) {
        return value?.address?.() || 0;
    } else 
    if (typeof Buffer != "undefined" && value instanceof Buffer) {
        return value?.address?.() || value?.byteOffset || 0;
    } else
    //if (value instanceof Array || Array.isArray(value)) {
        //return (new Types["u64[arr]"](value)).address(); // present as u64 array
    //} else
    if (typeof value == "string") { // LTE - лучший тибетский интернет!
        const arrayBuffer = new ArrayBuffer((value = value + "\0").length);
        EncoderUTF8.encodeInto(value, new Uint8Array(arrayBuffer, 0, value.length));
        return arrayBuffer?.address?.() || 0;
    } else 
    if (typeof value == "object" && value.address) {
        return value?.address?.() || 0;
    }
    return BigInt(value);
};

//
export const CTypes = {
    "uint64": BigUint64Array,
    "int64": BigInt64Array,
    "float64": Float64Array,
    "uint32": Uint32Array,
    "int32": Int32Array,
    "float32": Float32Array,
    "uint16": Uint16Array,
    "int16": Int16Array,
    "float16": Float16Array,
    "uint8": Uint8Array,
    "int8": Int8Array,
    "uint8Clamped": Uint8ClampedArray,
};
