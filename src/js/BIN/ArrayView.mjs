import { ViewUtils } from "./StructType.mjs";

//
export default class ArrayView extends ViewUtils {

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        super(layout, target, byteOffset, length);
    }

    //
    get $ownKeys() { return Array.from({length: this.$length}, (_, i) => i); };

    // TODO! Default values for array views
    get $initial() { return this; };

    //
    $has($name) { return (this.$length > $name && $name >= 0); };

    //
    $get($name = "*", $ref = false) {
        const $index = parseInt($name) || 0;
        const $T = this.$layout?.$typed ?? this.$layout;
        return super.$ref($index * this.$layout.$byteLength, $T, $ref, $name == "*" ? this.$length : null);
    }

    // 
    $set($name = "*", $member = 0) {
        const $index = parseInt($name) || 0;
        return super.$set($index * this.$layout.$byteLength, $member, this.$layout?.$typed ?? this.$layout);
    }
};
