//
export default class StructType {
    #name = "uint8";
    #offset = 0;
    #array = false;

    //
    constructor($name = "uint8", $offset = 0, $array = 1) {
        this.#name = $name;
        this.#offset = $offset;
        this.#array = $array;
    }

    //
    get $offset() { return this.#offset; };
    get $name() { return this.#name; };
    get $array() { return this.#array; };
};
