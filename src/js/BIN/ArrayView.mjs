import { ViewUtils } from "./StructType.mjs";

//
export default class ArrayView extends ViewUtils {

    //
    constructor(layout, target, byteOffset = 0, length = 1) {
        super(layout, target, length);
    }

    //
    get $ownKeys() { return Array.from({length: this.$length}, (_, i) => i); };

    // TODO! Default values for array views
    get $initial() { return this; };

    //
    $has($name) { return (this.$length > $name && $name >= 0); };

    //
    $get($name = "*", $ref = false) {
        const $index = parseInt($name);
        const $offset = $index * this.$byteLength;
        const $T = this.$layout?.$typed ?? this.$layout;
        return $ref ? super.$ref($offset, $T, $ref) : super.$get($offset, $T, $ref);
    }

    // 
    $set($name = "*", $member = 0) {
        const $index = parseInt($name);
        return super.$set($index * this.$byteLength, $member, this.$layout?.$typed ?? this.$layout);
    }
};
