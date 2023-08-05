//
export default class StructMember {
    #type = "uint8";
    #byteOffset = 0;
    #length = 1;

    //
    constructor($type = "uint8", $byteOffset = 0, $length = 1) {
        this.#type = $type;
        this.#byteOffset = $byteOffset;
        this.#length = $length;
    }

    //
    get $byteOffset() { return this.#byteOffset; };
    get $type() { return this.#type; };
    get $length() { return this.#length; };
}
