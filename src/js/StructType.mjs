import { CStructs, CTypes, AsInt } from "./Utils.mjs";

//
export default class StructType {
    #name = "uint8";
    #offset = 0;
    #array = false;
    #default = 0;
    #index = 0;

    //
    static $parse($name) {
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
        return new StructType($name, $offset, $array, $default, 0);
    }

    //
    constructor($name = "uint8", $offset = 0, $array = false, $default = 0, $index = 0) {
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
