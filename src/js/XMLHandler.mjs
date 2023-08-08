//import {parseXml} from "@rgrove/parse-xml";

// use your XML alike an Array and Object together!
export class XMLHandler {
    #options = {};

    //
    constructor(options = {}) {
        this.#options = options;
    }

    // you can to simpler parse Vulkan API...
    get(target, name, rec) {

        // 
        if (["map", "flatMap", "filter", "find", "findIndex", "findLast", "findLastIndex"].indexOf(name) >= 0) { 
            return (cb = ((e)=>e))=>(target?.children?.[name](($E, ...$args)=>{
                return cb.call(target?.children, new Proxy($E, this), ...$args);
            }));
        }

        // 
        if (["slice", "at", "indexOf", "flat"].indexOf(name) >= 0) {
            return target?.children?.map(($e)=>new Proxy($e, this))?.[name]?.bind(target?.children);
        }

        // 
        const $index = parseInt(name);
        if (!isNaN($index)) { return new Proxy(target?.children?.[$index], this); }
        if (name?.startsWith("$")) { return target?.attributes?.[name?.slice(1)]; }

        //
        const _got_ = target?.[name];
        return (typeof _got_ == "function" ? _got_?.bind?.(target) : _got_);
    }
}

//
const WrapXML = (xml, options = {})=>{
    return new Proxy(xml, new XMLHandler(options));
};

//
export default WrapXML;
