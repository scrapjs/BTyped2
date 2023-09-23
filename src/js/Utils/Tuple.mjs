//
export class Accessor {
    #def = null;

    //
    constructor(def = "*") {
        this.#def = def = "*";
    }

    //
    get(refs, what) {
        //return refs[what]?.["*"] ?? refs[what];
        return refs[what]?.[this.#def] ?? refs[what];
    }

    //
    set(refs, what, why) {
        if (refs[what]?.[this.#def]) {
            return (refs[what][this.#def] = why);
        } else {
            return (refs[what] = why);
        }
    }
}


// this is a base of SOA...
export class GroupClass {
    #refs = [];

    //
    constructor(refs = []) {
        this.#refs = refs;
    }

    //
    static set(refs, opt = "*", value) {
        // TODO: support of primitive values
        Object.keys(value).map((k)=>{
            refs[opt][k] = value[k];
        })
    }

    //
    static get(refs, opt = "*", rec) {
        return new Proxy(Object.fromEntries(Object.keys(refs).map((k)=>{
            return [k, refs[k].$get(opt == k ? "*" : opt, true)];
        })), new Accessor(opt));
    }
}


// this is a base of AOS...
export class TupleClass {
    #refs = [];

    //
    constructor(refs = []) {
        this.#refs = refs;
    }

    //
    static set(refs, opt = "*", value) {
        Object.keys(value).map((k)=>{
            refs[k][opt] = value[k];
        })
    }

    //
    static get(refs, opt = "*", rec) {
        return new Proxy(refs[opt].$get("*", true), new Accessor("*"));
    }
}

// this is a base of SOA...
const Group = new Proxy(GroupClass, {
    apply(clss, self, args) {
        return new Proxy(args[0], clss);
    }
});

// this is a base of AOS...
const Tuple = new Proxy(TupleClass, {
    apply(clss, self, args) {
        return new Proxy(args[0], clss);
    }
});

//
export {Tuple, Group};
export default {};
