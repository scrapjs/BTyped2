//
export default class StructType {
    #name = "uint8";
    #offset = 0;
    #array = false;
    #default = 0;
    #index = 0;

    //
    constructor($name = "uint8", $offset = 0, $array = 1, $default = 0, $index = 0) {
        this.#name = $name;
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
