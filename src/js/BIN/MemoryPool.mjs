
//
/*export class MemoryHandler {
    constructor(options) {
        Object.assign(this, options);
    }

    // TODO?: needs to un-use typed arrays?
    get(target, index, receiver) {
        const $typed = new this.$typed(target.HEAP8.buffer, target.HEAP8.byteOffset + this.$ptr, this.$length);
        const $got = $typed[index];
        return (typeof $got == "function") ? $got.bind($typed) : $got;
    }

    // TODO?: needs to un-use typed arrays?
    set(target, index, value) {
        const $typed = new this.$typed(target.HEAP8.buffer, target.HEAP8.byteOffset + this.$ptr, this.$length);
        $typed[index] = value;
        return true;
    }
}*/

// are basis of any decoders or encoders...
export default class MemoryPool {
    #registry = null;

    //
    constructor() {
        // add GC support for WASM
        this.#registry = new FinalizationRegistry((meta)=>{
            //((await (this.#codecs?.[meta["$codec"]])) || meta["$codec"])._free(meta["$ptr"]);
            meta["$codec"]._free(meta["$ptr"]);
        });
    }

    async $load(url, handle) {
        // fix issue with fetch
        if (typeof url == "string") {
            url = url.trim() || ""; 
            if (url.startsWith(".")) { url = location.origin + "/" + url; };
            if (url.startsWith("/")) { url = location.origin + url; }
        }

        //
        this.URL = url;
        this.DIR ||= location.hostname;

        //
        let fs = null;

        //
        try {
            fs = (await import("indexeddb-fs")).default;
        } catch(e) {
            //console.error(e);
        }

        // Check if a directory exists
        if (fs) {
            let _exists = false;
            try { _exists = await fs.isDirectory(this.DIR ||= ""+location.hostname.hashCode()); } catch (e) {};
            if (!_exists) { await fs.createDirectory(this.DIR); }
        }

        //
        if (fs) {
            let _exists = false;
            try { _exists = await fs.isDirectory(this.DIR += "/framelib"); } catch (e) {};
            if (!_exists) { await fs.createDirectory(this.DIR); }
        }

        //
        let response = url;
        try {
            response = (url instanceof Response) ? url : await fetch((url instanceof Blob) ? URL.createObjectURL(url) : url, { mode: "cors", keepalive: true });
        } catch(e) {
            console.log(url);
            console.error(e);
        }

        //
        const blob = (url instanceof Blob) ? url : (response.ok ? await response.blob() : null);
        const fr = new FileReader();

        //
        if (response.ok) {
            const pm = new Promise((r,e)=>{ fr.onload = r, fr.onerror = e; });
            fr.readAsArrayBuffer(blob); await pm;

            try {
                return (await handle(fr.result, blob));
            } catch(e) {
                console.error(e);
            }

        } else {
            this.reader = null;
            console.error("URL: " + url + ", Error HTTP: " + response.status);
        }
        
        return blob;
    }


    //
    $concat(resultConstructor, ...arrays) {
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
    $wrap($c, what, TA = Uint32Array) {
        // TODO: fix memory micro-leak
        const codec = $c;//(await (this.#codecs?.[$c])) || $c;
        const _val_ = codec._calloc(1, TA.BYTES_PER_ELEMENT||1);//InputData
        const _ptr_ = ()=>(new DataView(codec.HEAP8.buffer, codec.HEAP8.byteOffset));//new Proxy(codec, new MemoryHandler({$ptr: _val_, $typed: TA, $length: length}));//new TA(codec.HEAP8.buffer, codec.HEAP8.byteOffset + _val_, 1);
        _ptr_().setUint32(_val_, what?.byteOffset ?? what);
        this.#registry.register(_ptr_, {"$ptr": _val_, "$codec": $c });
        return [_ptr_, _val_, 1];
    }

    //
    $calloc($c, length = 4, TA = Uint8Array) {
        const codec = $c;//(await (this.#codecs?.[$c])) || $c;
        const _val_ = codec._calloc(1, (length||4)*(TA.BYTES_PER_ELEMENT||1));
        const _ptr_ = ()=>(new DataView(codec.HEAP8.buffer, codec.HEAP8.byteOffset));//new Proxy(codec, new MemoryHandler({$ptr: _val_, $typed: TA, $length: length}));//new TA(codec.HEAP8.buffer, codec.HEAP8.byteOffset + _val_, (length||4));
        this.#registry.register(_ptr_, {"$ptr": _val_, "$codec": $c });
        return [_ptr_, _val_, length];
    }

    //
    $u32($c, $ptr) {
        return $ptr?.[0] ?? (new DataView($c.HEAP8.buffer, $c.HEAP8.byteOffset + $ptr).getUint32(0, true));
    }

    //
    $u8a($c, $ptr, $l) {
        return new Uint8Array($c.HEAP8.buffer, $c.HEAP8.byteOffset + ($ptr?.[0] || $ptr), $l);
    }
}
