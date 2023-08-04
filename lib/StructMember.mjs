//
export default class StructMember {
    #name = "uint8";
    #byteOffset = 0;
    #length = 1;

    //
    constructor($name = "uint8", $byteOffset = 0, $length = 1) {
        this.#name = $name;
        this.#byteOffset = $byteOffset;
        this.#length = $length;
    }

    //
    get $byteOffset() { return this.#byteOffset; };
    get $name() { return this.#name; };
    get $length() { return this.#length; };
}
