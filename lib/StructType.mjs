//
export default class StructType {
    #name = "uint8";
    #offset = 0;
    #array = false;
    #default = 0;
    #index = 0;

    //
    constructor($name = "uint8", $offset = 0, $array = false, $default = 0, $index = 0) {
        if ($name instanceof StructType) {
            this.#name = $name.$name || "uint8";
            this.#offset = $name.$offset || 0;
            this.#array = $name.$array || false;
            this.#default = $name.$default || 0;
            this.#index = ($offset || $name.$index || 0);
        } else {
            this.#name = $name;
            this.#offset = $offset;
            this.#array = $array;
            this.#default = $default;
            this.#index = $index;
        }
    }

    //
    get $offset() { return this.#offset; };
    get $name() { return this.#name; };
    get $array() { return this.#array; };
    get $default() { return this.#default; };
    get $index() { return this.#index; };
};
