import StructView from "./StructView.mjs";
import ProxyHandle from "./ProxyHandle.mjs";
import { CStructs } from "./Utils.mjs";

//
export default class TypeAlias {
    #typed = "";
    #target = "";

    //
    constructor(typed, target) {
        this.#typed = typed;
        this.#target = target;

        //
        if (this.#typed) { CStructs[this.#typed] = this; };
    }

    //
    get $typed() { return this.#typed; }
    get $target() { return this.#target; }

    //
    $create(...$args) { return CStructs[this.#target].$create(...$args); }
    $wrap(...$args) { return CStructs[this.#target].$wrap(...$args); }
    $view(...$args) { return CStructs[this.#target].$view(...$args); }
    $get($name) { return $name; }
};
