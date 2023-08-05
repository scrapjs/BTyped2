import ArrayLayout from "./lib/ArrayLayout.mjs";
import StructLayout from "./lib/StructLayout.mjs";
import ArrayView from "./lib/ArrayView.mjs";
import StructView from "./lib/StructView.mjs";
import ProxyHandle from "./lib/ProxyHandle.mjs";

//
export const StructWrap = ($layout)=>{
    return new Proxy(function _STRUCT_(){}, new ProxyHandle($layout));
}

//
export {ArrayLayout, StructLayout, ArrayView, StructView, StructWrap, ProxyHandle};
