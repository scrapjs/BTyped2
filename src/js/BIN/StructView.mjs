import { ViewUtils } from "./StructType.mjs";

//
export default class StructView extends ViewUtils {
    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        super(layout, target, byteOffset, length);
    }

    //
    get $ownKeys() { return [...this.$layout.$layout.keys(), /*...Array.from({length: this.#length}, (_, i) => i)*/]; };
    get $initial() {
        this.$ownKeys.forEach(($e)=>{
            this.$set($e, this.$layout.$typeof($e).$default);
        });
        return this;
    }

    //
    $has($name) { return (this.$layout.$layout.has($name)); };
    $get($name = "*", $ref = false) {
        const $type = this.$layout.$typeof($name);
        return super.$ref($type.$offset || 0, $type.$name, $ref, $type.$array);
    }

    // 
    $set($name = "*", $member = 0) {
        const $type = this.$layout.$typeof($name);
        return super.$set($type.$offset || 0, $member, $type.$name ?? this.$layout, $type.$array);
    }
};
