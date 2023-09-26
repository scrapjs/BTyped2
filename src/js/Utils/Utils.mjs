//
import {
    Float16Array, isFloat16Array, isTypedArray,
    getFloat16, setFloat16,
    hfround, f16round,
} from "/@petamoriken/float16/browser/float16.mjs";

//
//DataView.prototype.getFloat16 = function (...$args) { return getFloat16(this, ...$args); };
//DataView.prototype.setFloat16 = function (...$args) { return setFloat16(this, ...$args); };
Math.hfround = hfround;
Math.f16round = f16round;

//
const DataViewHandle = {
    //
    construct($I, $A, $T) {
        return new Proxy(Reflect.construct($I, $A, $T), DataViewHandle);
    },

    //
    get($I, $N, $R) {
        if ($N == "getFloat16") { return getFloat16.bind($I, $I); };
        if ($N == "setFloat16") { return setFloat16.bind($I, $I); };
        const $fn = Reflect.get($I, $N, $R);
        return typeof $fn == "function" ? $fn.bind($I) : $fn;
    },

    //
    ownKeys(...$args) { return Reflect.ownKeys(...$args); },
    has(...$args) { return Reflect.has(...$args); }
};

// more safer way, don't flame on DataView itself!
export const DataViewWrap = new Proxy(DataView, DataViewHandle);

// avoid limitation
const _isView_ = ArrayBuffer.isView;
ArrayBuffer.isView = function(...$args) {
    return (isFloat16Array(...$args) || _isView_.apply(this, $args));
}

//
export const IsAbv = (value) => {
    return value && value.byteLength != undefined && (value instanceof ArrayBuffer);
}

//
export const IsNumber = (index) => {
    return typeof index == "number" || typeof index == "bigint" || Number.isInteger(index) || typeof index == "string" && index.trim() != "" && /^\+?\d+$/.test(index.trim());
}

//
export const AsInt = (value) => {
    if (ArrayBuffer?.isView?.(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) { return value?.byteOffset || 0; }
    if (value?.$isView) { return value.$byteOffset; }
    return IsNumber(value) ? parseInt(value) : 0;
}

//
export const AsFloat = (index) => {
    return IsNumber(index) ? parseFloat(index) : 0;
}

//
export const EncoderUTF8 = new TextEncoder(); //U8Cache

//
String.prototype.vsplit = function(symbol){
    if (this != "") {
        return (this.startsWith(symbol) ? ["", ...this.substring(1).vsplit()] : this.split(symbol))||[this];
    }
    return [this];
};

//
export const AddressOf = (obj)=>{
    return (typeof obj?.address == "function" ? obj?.address?.() : obj?.address) || 0n;
}

//
export const AsBigInt = (value)=>{
    if (!value) {
        return 0n;
    } else
    if (IsNumber(value)) {
        return BigInt(value);
    } else
    if (ArrayBuffer?.isView?.(value) || (value?.buffer && value?.BYTES_PER_ELEMENT)) {
        return AddressOf(value) || BigInt(value?.byteOffset) || 0;
    } else 
    if (value instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" && value instanceof SharedArrayBuffer)) {
        return AddressOf(value);
    } else 
    if (typeof Buffer != "undefined" && value instanceof Buffer) {
        return AddressOf(value) || BigInt(value?.byteOffset) || 0n;
    } else
    //if (value instanceof Array || Array.isArray(value)) {
        //return (new Types["u64[arr]"](value)).address(); // present as u64 array
    //} else
    if (typeof value == "string") { // LTE - лучший тибетский интернет!
        const arrayBuffer = new ArrayBuffer((value += "\0").length);
        EncoderUTF8.encodeInto(value, new Uint8Array(arrayBuffer, 0, value.length));
        return AddressOf(arrayBuffer);
    } else 
    if (value?.$isView) { return BigInt(value?.$address) || BigInt(value?.$byteOffset) || 0n; } else
    if (typeof value == "object") { return AddressOf(value); }
    return BigInt(value);
};

//
export const CTypes = new Map();
export const CStructs = new Map();

//
const swap32 = (val) => {
    return ((val & 0xFF) << 24)
           | ((val & 0xFF00) << 8)
           | ((val >> 8) & 0xFF00)
           | ((val >> 24) & 0xFF);
}

//
const exchange = (obj, key, _new_)=> { const _old_ = obj[key]; obj[key] = _new_; return _old_; };

//
/**
 * @deprecated Please, use Map with new methods
 */
Object.exchange ??= exchange;

//
Array.exchange ??= exchange;
Array.prototype.exchange ??= function(I, _new_) { return exchange(this, I, _new_); };

//
Map.prototype.exchange ??= function(name, val) { const $old = this.get(name); this.set(name, val); return $old; }
Map.prototype.shift ??= function(name, val) { const $old = this.get(name); this.delete(name); return $old; }

//
WeakMap.prototype.exchange ??= function(name, val) { const $old = this.get(name); this.set(name, val); return $old; }
WeakMap.prototype.shift ??= function(name, val) { const $old = this.get(name); this.delete(name); return $old; }

//
const createDOMCanvas = (W,H) => {
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        return new Promise((R,E)=>{
            const id = uuidv4();
            const single = (ev) => { if (ev.data.id == id) { self.removeEventListener('message', single); R(ev.data.offscreen); }; };
            self.addEventListener('message', single);
            // if are blob, make as URL
            //if (url instanceof Blob) { url = URL.createObjectURL(url); };
            self.postMessage({ id, offscreen: "request", W,H });
        });
    }

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    return canvas;
}

//
const loadImageBitmap = async (bitmap, createFunc = createDOMCanvas, showFunc = (C,B)=>{
    C.getContextDeepSpace("2d", { 
        desynchronized: true, 
        willReadFrequently: true
    }).drawImage(B, 0, 0);
}, getFunc = (C)=>C) => {
    bitmap = await bitmap;
    const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    const canvas = await createFunc(bitmap.width, bitmap.height, bitmap);//(offscreen || isWorker) ? new OffscreenCanvas(bitmap.width, bitmap.height) : createDOMCanvas(bitmap.width, bitmap.height);
    showFunc(canvas, bitmap);
    return await getFunc(canvas);
}

//
const loadImage = async (url) => {
    let image = new Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.loading = "eager";
    image.async = true;
    image.crossOrigin = "anonymous";

    // don't doubt about that
    let $url = await url; image.src = ($url instanceof Blob) ? URL.createObjectURL($url) : $url;
    await image.decode();

    // FOR DEBUG!
    /*
    image.width = 160;
    image.height = 120;
    image.alt = "Problematic";
    document.body.appendChild(image);
    */

    //
    return image;
}

//
const uuidv4 = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

//
const loadBitmapThroughput = async (url) => {
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        return new Promise((R,E)=>{
            const id = uuidv4();
            const single = (ev) => { if (ev.data.id == id) { self.removeEventListener('message', single); R(ev.data.svg); }; };
            self.addEventListener('message', single); let T = [];
            if (url instanceof ArrayBuffer || (typeof SharedArrayBuffer != "undefined" ? url instanceof SharedArrayBuffer : false)) 
                { T.push([url]); }
            // if are blob, make as URL
            //if (url instanceof Blob) { url = URL.createObjectURL(url); };
            self.postMessage({ id, svg: "request", url }, ...T);
        });
    } else {
        return createImageBitmap(await loadImage(url), {
            colorSpaceConversion: "none",
            resizeQuality: "pixelated"
        });
    }
}

// needs interface for worker
const provideForWorker = (worker) => {
    worker.addEventListener('message', async (ev) => {
        if (ev.data.url) {
            let bitmap = await createImageBitmap(await loadImage(ev.data.url), {
                colorSpaceConversion: "none",
                resizeQuality: "pixelated"
            });
            worker.postMessage({id: ev.data.id, svg: bitmap}, [bitmap]);
        }
        if (ev.data.W && ev.data.H) {
            let shared = createDOMCanvas(ev.data.W, ev.data.H);
            let offscreen = shared.transferControlToOffscreen();
            worker.postMessage({id: ev.data.id, offscreen}, [offscreen]);
        }
    });
    return worker;
}


//
const createSRGBAlphaBitmap = async function(_bitmap_){
    const _canvas_ = new OffscreenCanvas(_bitmap_.width, _bitmap_.height);

    let _ctx_ = null;
    let _trying_ = [ "extended-sRGB", "extended-srgb", "scrgb", "scRGB", "srgb", "sRGB" ];
    for (const _try_ of _trying_) {
        try {
            _ctx_ = _canvas_.getContext("2d", {
                ["color-space"]: _try_,
                colorSpaceConversion: "none",
                colorSpace: _try_,
                colorEncoding: "float16",
                colorType: "float16",
                storageFormat: "float16",
                pixelFormat: "float16",
                dataType: "float16"
            });
            break;
        } catch (e) {
            //console.warn("ColorSpace " + _try_ + " not supported...");
        }
    };
    if (!_ctx_) { _ctx_ = _canvas_.getContext("2d"); };

    _ctx_.filter = typeof CanvasFilter != "undefined" ? new CanvasFilter(
        [{
            filter: "colorMatrix",
            type: "matrix",
            values: [
                0, 0, 0, 0, 1,
                0, 0, 0, 0, 1,
                0, 0, 0, 0, 1,
                1, 0, 0, 0, 0
            ],
        }]
    ) : "url()";
    _ctx_.drawImage(_bitmap_,0,0);
    
    return await createImageBitmap(_canvas_, {
        colorSpaceConversion: "none",
        resizeQuality: "pixelated"
    });
}


// TODO: prefer use-profile instead
const _deepSpace_ = function(type, options) {
    let _ctx_ = null;
    let _trying_ = [
        //"rec2020", "rec-2020",
        //"rec2020-linear", "rec-2020-linear", 
        //"display-p3", 
        "extended-sRGB", "extended-srgb", "scrgb", "srgb" 
    ];

    for (const _try_ of _trying_) {
        try {
            _ctx_ = this.getContext(type, {...{
                ["color-space"]: _try_,
                colorSpaceConversion: "none",
                colorSpace: _try_,//
                colorEncoding: "float16",
                colorType: "float16",
                storageFormat: "float16",
                pixelFormat: "float16",
                dataType: "float16"
            }, options});
            break;
        } catch (e) {
            //console.warn("ColorSpace " + _try_ + " not supported...");
        }
    };

    if (!_ctx_) { return this.getContext(type, options); };
    return _ctx_;
}

//
if (typeof HTMLCanvasElement != "undefined") {
    HTMLCanvasElement.prototype.getContextDeepSpace = _deepSpace_;
}

if (typeof OffscreenCanvas != "undefined") {
    OffscreenCanvas.prototype.getContextDeepSpace = _deepSpace_;
}

//
const loadBitmapAsBlob = async (url) => {
    let $url = await url;
    return createImageBitmap(($url instanceof Blob) ? $url : (await fetch($url, { mode: "cors" }).then(res => res.blob())), {
        colorSpaceConversion: "none",
        resizeQuality: "pixelated"
    });
}

//
const blobToArrayBuffer = async(url) => {
    const $url = await url;
    if ($url instanceof Blob) {
        const FR = new FileReader();
        const PM = new Promise((RV, RJ) => { FR.onload = ()=>RV(FR.result), FR.onerror = RJ; });
        FR.readAsArrayBuffer($url);
        return PM;
    }
    return await fetch(($url instanceof Blob) ? URL.createObjectURL($url) : $url, { mode: "cors" }).then(res => res.arrayBuffer())
}

//
const saveBlob = (url, name) => {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href =  url;
    a.download = name;
    a.click();
    a.remove();
    return url;
}

//
const concat = (resultConstructor, ...arrays) => {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

//
const encodeURL = async (chunked, type, blob = false) => {
    chunked = chunked.map((chunk)=>{
        if (typeof chunk === "string") {
            return new TextEncoder().encode(chunk);
        }
        return chunk;
    });

    const BLOB = new Blob(chunked, {type});
    if (blob) { return URL.createObjectURL(BLOB); };
    {
        const FR = new FileReader();
        FR.readAsDataURL(BLOB);
        const READ = new Promise(resolve => {
            FR.onload = ()=>resolve(FR.result);
        });
        return await READ;
    }

    //return `data:${type};base64,${window.btoa(String.fromCharCode(...concat(Uint8Array, ...chunked)))}`;
}

//
const toBlob = (canvas, mimeType, quality) => {
    return new Promise((resolve, reject)=>{
        canvas.toBlob(resolve, mimeType, quality);
    });
}

const encodeSvg = (svgString) => {
    return svgString.replace('<svg',(~svgString.indexOf('xmlns')?'<svg':'<svg xmlns="http://www.w3.org/2000/svg"'))
          .replace(/"/g, '\'')
          .replace(/%/g, '%25')
          .replace(/#/g, '%23')       
          .replace(/{/g, '%7B')
          .replace(/}/g, '%7D')         
          .replace(/</g, '%3C')
          .replace(/>/g, '%3E')
          .replace(/\s+/g,' ');
}

const getSharedImageData = (ctx, x, y, w_or_image, h) => {
    let w = w_or_image;
    if (w_or_image.data) { w = w_or_image.width, h = w_or_image.height };
    const shared = (w_or_image.data?.buffer || w_or_image.data) || new (typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : ArrayBuffer)(w*h*4);
    for (let Y=0;Y<h;Y++) {
        new Uint32Array(shared, Y*w*4, w).set(new Uint32Array(ctx.getImageData(x, y+Y, w, 1).data.buffer));
    }
    return {
        width: w,
        height: h,
        data: shared
    };
}

//
const _LOG_ = (_got_)=>{
    console.log(_got_);
    return _got_;
}

const createImageBitmapAsync = async (_promise)=>{
    return await createImageBitmap(await _promise, {
        colorSpaceConversion: "none",
        resizeQuality: "pixelated"
    });
}

const createOffscreenCanvas = (...args)=> {
    return new OffscreenCanvas(...args);
}

//
const promiseDomContentLoaded = ()=> {
    const _target_ = {};
    const _promise_ = new Promise((r, c)=>{
        document.addEventListener("DOMContentLoaded", _target_._request = ()=>{
            _target_._catch = null, _target_._request = null; r(_target_);
        });
        _target_._catch = (_r_)=> {c(_r_); _target_._catch = null;};
    });
    return new Proxy(_promise_, {
        get(target, name) { 
            if (name == "cancel") { return ()=>{
                document.removeEventListener(_target_._request); _target_._request = null;
                _target_._catch("Request animation frame was canceled");
            }};
            return target[name].bind(target);  
        }
    });
}

//
const promiseAnimationFrame = ()=> {
    const _target_ = {};
    const _promise_ = new Promise((r, c)=>{
        _target_._request = requestAnimationFrame(()=>{
            _target_._catch = null, _target_._request = null; r(_target_);
        });
        _target_._catch = (_r_)=> {c(_r_); _target_._catch = null;};
    });
    return new Proxy(_promise_, {
        get(target, name) {
            if (name == "cancel") { return ()=>{
                cancelAnimationFrame(_target_._request); _target_._request = null;
                _target_._catch("Request animation frame was canceled");
            }}
            return target[name].bind(target); 
        }
    });
}

//
const promiseTimeout = (ms = 0)=> {
    const _target_ = {};
    const _promise_ = new Promise((r, c)=>{
        _target_._request = setTimeout(()=>{
            _target_._catch = null, _target_._request = null; r(_target_);
        }, ms);
        _target_._catch = (_r_)=> {c(_r_); _target_._catch = null;};
    });
    return new Proxy(_promise_, {
        get(target, name, receiver) { 
            
            if (name == "cancel") { return ()=>{
                clearTimeout(_target_._request); _target_._request = null;
                _target_._catch("Timeout was canceled");
            }};
            return target[name].bind(target);
        }
    });
}

//
export {
    promiseAnimationFrame, promiseTimeout, promiseDomContentLoaded, exchange, createSRGBAlphaBitmap, 
    _LOG_, createImageBitmapAsync, createDOMCanvas, loadImageBitmap, blobToArrayBuffer, createOffscreenCanvas, toBlob, encodeURL, concat, saveBlob, loadBitmapAsBlob, provideForWorker, loadBitmapThroughput, uuidv4, loadImage, swap32, encodeSvg, getSharedImageData
}
