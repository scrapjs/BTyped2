//
export default class ProxyHandle {
    #layout = null;

    //
    constructor(layout) {
        this.#layout = layout;
    }

    // when from wrapped hack function
    construct(_, $args, $newTarget) {
        const $layout = this.#layout;
        if (ArrayBuffer.isView($args[0]) || ($args[0]?.buffer && $args[0]?.BYTES_PER_ELEMENT) || $args[0] instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" && $args[0] instanceof SharedArrayBuffer) || typeof $args[0] == "function") {
            return $layout.$wrap(...$args);
        } else
        if (typeof $args[0] == "number" || Array.isArray($args[0]) || (typeof $args[0] == "object")) {
            return $layout.$create(...$args);
        }
    }

    // when wrapped from DataView
    get(target, name, rec) {
        //if (!(target instanceof DataView)) { throw Error("Proxied not DataView..."); };
        const $view = target.$isView ? target : this.#layout.$view(target);
        if (name == "$initial") { return new Proxy($view.$initial, this); };
        if (name == "$length") { return $view.$length; };
        if (name == "$buffer" || name == "$target") { return $view.$target; };
        if (name == "$byteLength") { return $view.$byteLength; };
        if (name == "$byteOffset") { return $view.$byteOffset; };
        if (name == "$isView") { return true; };
        return $view.$get(name);
    }

    // when wrapped from DataView
    set(target, name, value) {
        //if (!(target instanceof DataView)) { throw Error("Proxied not DataView..."); };
        const $view = target.$isView ? target : this.#layout.$view(target);
        return $view.$set(name, value);
    }

    //
    ownKeys(target) {
        const $view = target.$isView ? target : this.#layout.$view(target);
        return $view.$ownKeys;
    }

    //
    has(target, $name) {
        const $view = target.$isView ? target : this.#layout.$view(target);
        return $view.$has($name);
    }
};

//
export const StructWrap = ($layout)=>{
    return new Proxy(function _STRUCT_(){}, new ProxyHandle($layout));
};
