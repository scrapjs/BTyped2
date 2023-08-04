//
export default class StructProxyHandle {
    #layout = null;

    //
    constructor(layout) {
        this.#layout = layout;
    }

    //
    get(target, name, rec) {
        if (!(target instanceof DataView)) { throw Error("Proxied not DataView..."); };
        return this.#layout.$view(target).get(name);
    }

    //
    set(target, name, value) {
        if (!(target instanceof DataView)) { throw Error("Proxied not DataView..."); };
        return this.#layout.$view(target).set(name, value);
    }
}
