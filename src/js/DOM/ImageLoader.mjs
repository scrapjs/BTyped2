const _LOG_ = (...$args)=>{
    console.log(...$args);
    return $args[0];
}

// 
export default class ImageLoader {
    #self = null;
    #WC = null;
    
    //
    constructor(self, _WC) {
        this.#self = self;
        this.#WC = _WC;

        //
        (this._empty = `data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=`);
        self.addEventListener("error", (e)=> { e.preventDefault(); 
            if (this._mayChange()) { this._loadImage(self.srcset || self.src); }
        });
        self.addEventListener("load", (e)=> { e.preventDefault(); 
            self.style.removeProperty("--content");
            self.style.removeProperty("--display");
        });

        //
        const _src_ = self.src;
        self.src = "";
        self.src = _src_;

        //
        this._available = (self.loading != "lazy");
        if (this._mayChange()) { this._loadImage(self.srcset || self.src); };

        //
        this._observer = new IntersectionObserver(()=>{
            this._activate();
        }, {
            root: document.querySelector(':root'),
            rootMargin: "0px",
            threshold: 0.0,
        });
    }

    _mayChange() {
        const self = this.#self;
        return (!this._srcset || (typeof this._srcset == "function" && this._available) || (typeof this._srcset != "function")) ;
    }

    _activate() {
        const self = this.#self;
        this._available = true;
        this._srcset = typeof this._srcset == "function" ? this._srcset() : this._srcset;
    }

    _loadImage(_srcset) {

        //
        _srcset = (_srcset.split(",") || [_srcset]).map((_src_)=>{
            const _spaced_ = _src_.split(" ") || [_src_];
            const _media_ = _spaced_.length > 1 ? _spaced_.pop() : "";
            return {
                url: _spaced_.join(" ") || _media_,
                media: _media_
            };
        });

        //
        const self = this.#self;
        if (!_srcset) { return this; };

        //
        if (this._prevent) {
            self.removeEventListener("contextmenu", this._prevent);
            self.removeEventListener("dragstart", this._prevent);
        }

        // use lazy loading
        self.decoding = "async";
        this._srcset = (async ()=>{

            // make set srcset
            _srcset = _srcset.map(async (src)=>{
                const thread = this.#WC(), instance = thread.instance;
                try { src.url = await (await instance.load)(src.url).then(_LOG_).then(URL.createObjectURL); thread.counter--; } catch(e) { console.error(e); }; return src;
            });

            //
            {
                self.style.setProperty('--content', `image-set(${
                    (await Promise.all(_srcset)).map((src)=>{ return `url("${src.url}") ${src.media}`; }).join(", ")
                })`);

                //
                self.style.removeProperty("--display");
                self.style.setProperty('content', 'var(--content)', '');

                // optimize image loading
                self.fetchPriority = "high";
                self.crossOrigin = "anonymous";
                self.loading = "eager";
                self.decoding = "async";
                self.async = true;
                self.draggable = false;

                // ban actions by default
                self.addEventListener("contextmenu", this._prevent ||= (e)=>{ e.preventDefault(); }, true);
                self.addEventListener("dragstart", this._prevent, true);

                //
                this._available = false;
            }
            
            //
            return _srcset;
        });

        //
        if (self.loading != "lazy" || this._available) 
        { this._activate(); };
        return this; 
    }

    disconnectedCallback() {
        const self = this.#self;
        (this._observer.unobserve||this._observer.disconnect).call(this._observer, self);
    }

    connectedCallback() {
        const self = this.#self;
        this._observer.observe(self);
        if (this._mayChange()) { this._loadImage(self.srcset || self.src); };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const self = this.#self;
        if ((name == "src" || name == "srcset") && newValue != oldValue && newValue != this._empty) {
            if (this._mayChange()) { this._loadImage(newValue); };
        }
    }

    static get observedAttributes() {
        return ['src', 'srcset'];
    }
}
