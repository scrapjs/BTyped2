import { CStructs, CTypes } from "../Utils/Utils.mjs";

//
export default class TypeAlias {
    #typed = "";
    #target = "";

    //
    constructor(typed, target) {
        this.#typed = typed;
        this.#target = target;

        //
        if (this.#typed) { CStructs.set(this.#typed, this); };
    }

    //
    get $typed() { return this.#typed; }
    get $target() { return this.#target; }

    //
    $create(...$args) { return (CTypes.get(this.#target) ?? CStructs.get(this.#target)).$create(...$args); }
    $wrap(...$args) { return (CTypes.get(this.#target) ?? CStructs.get(this.#target)).$wrap(...$args); }
    $view(...$args) { return (CTypes.get(this.#target) ?? CStructs.get(this.#target)).$view(...$args); }
    $get($name) { return $name; }
};
