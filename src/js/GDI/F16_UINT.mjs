import {compileShader, createProgram} from "./GL2.mjs"

//
export default class F16_UINT {
    constructor() {
        this.canvas = new OffscreenCanvas(2, 2);
        this.gl = this.canvas.getContext("webgl2", {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            alpha: true,
            depth: false,
            precision: "highp",
            antialias: false,
            powerPreference: "high-performance",
            desynchronized: true, 
            willReadFrequently: true,
            colorSpace: "srgb",

            //
            colorEncoding: "float16",
            colorType: "float16",
            storageFormat: "float16",
            pixelFormat: "float16",
            dataType: "float16"
        });

        // 
        this.gl.colorSpace = "srgb";
        this.gl.drawingBufferColorSpace = "srgb";
        this.gl.unpackColorSpace = "srgb";

        // not working...
        this.u16 = true;//this.gl.getExtension("EXT_texture_norm16");
        this.f32 = this.gl.getExtension("EXT_color_buffer_float");
        this.f16 = this.gl.getExtension("EXT_color_buffer_half_float");

        //
        //if (this.gl.drawingBufferStorage)
        if (this.gl.drawingBufferStorage) {
            this.gl.drawingBufferStorage(this.gl.RGBA16F, this.canvas.width, this.canvas.height);
            //this.gl.drawingBufferStorage(this.gl.RGBA16UI, this.canvas.width, this.canvas.height);
        }

        //
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        this.gl.pixelStorei(this.gl.PACK_ALIGNMENT, 1);

        //this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        //this.gl.colorMask(true, true, true, true);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.bindVertexArray(this.gl.createVertexArray());

        //
        this.is16bit = !!this.u16;
        this.program = this.func();
    }

    image(imageData) {
        const index = 0;
        this.width = imageData.width, this.height = imageData.height;

        // Now that the image has loaded make copy it to the texture.
        let texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + index);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, imageData.width, imageData.height, 0, this.gl.RGBA, this.gl.HALF_FLOAT, imageData.data);

        //return texture;
        return this;
    }

    gen() {
        const func = this.program;

        //
        //this.resize(this.width, this.height);
        this.gl.activeTexture(this.gl.TEXTURE0 + 2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.output = this.gl.createTexture());
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        //
        const u16 = this.is16bit ? 1 : 0;
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, u16 ? this.gl.RGBA16UI : this.gl.RGBA8UI, this.width, this.height, 0, this.gl.RGBA_INTEGER, u16 ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_BYTE, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb = this.gl.createFramebuffer());
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.output, 0);

        //
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.clearBufferuiv(this.gl.COLOR, 0, [0, 0, 0, 0]);
        this.gl.disable(this.gl.BLEND);
        this.gl.useProgram(func[u16]);
        this.gl.uniform1i(this.gl.getUniformLocation(func[u16], `_image0_`), 0);
        this.gl.uniform1i(this.gl.getUniformLocation(func[u16], `_shift0_`), 0);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        /*return createImageBitmap(this.canvas, {
            colorSpaceConversion: "none",
            resizeQuality: "pixelated"
        });*/

        return this;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    func($math) {
        const _vertex_ = ()=>`#version 300 es
precision lowp float;
precision lowp int;

out highp vec2 texcoord;

void main() {
    const lowp vec2 _vertex_[4] = vec2[4](
        vec2(-1.f, -1.f),
        vec2( 1.f, -1.f),
        vec2( 1.f,  1.f),
        vec2(-1.f,  1.f)
    );
    
    texcoord = vec2(_vertex_[gl_VertexID].xy*0.5f+0.5f);
    gl_Position = vec4(_vertex_[gl_VertexID], 0.f, 1.f);
}`;

        const _fragment_ = (for16bit)=>`#version 300 es
#define Q ${for16bit ? `highp` : `lowp`} 
precision Q float;
precision Q int;
precision Q sampler2D;
precision Q usampler2D;

in highp vec2 texcoord;

uniform Q sampler2D _image0_;
uniform lowp int _shift0_;

//
layout (location = 0) out Q uvec4 fragColor;

// Converts a color from linear light gamma to sRGB gamma
Q vec4 fromLinear(in Q vec4 linearRGB) {
    bvec4 cutoff = lessThan(linearRGB, vec4(0.0031308));
    highp vec4 higher = vec4(1.055)*pow(linearRGB, vec4(1.0/2.4)) - vec4(0.055);
    highp vec4 lower = linearRGB * vec4(12.92);
    return vec4(mix(higher, lower, cutoff).xyz, linearRGB.w);
}

// Converts a color from sRGB gamma to linear light gamma
Q vec4 toLinear(in Q vec4 sRGB) {
    bvec4 cutoff = lessThan(sRGB, vec4(0.04045));
    highp vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
    highp vec4 lower = sRGB/vec4(12.92);
    return vec4(mix(higher, lower, cutoff).xyz, sRGB.w);
}

// for PNG support...
Q uint _swap16_(in Q uint a) { return ((a&0xFFu)<<8)|((a&0xFF00u)>>8); }
Q uint _inc_(in Q uint c, in int p) { return (c<<p); }

// doesn't support unclamped values
Q float _inc_(in Q float c, in int p) { return clamp(c, 0.f, 1.f); }

//
void main() {
    Q vec4 _color0_ = texture(_image0_, texcoord);
    Q float R0 = _inc_(_color0_.r, _shift0_), G0 = _inc_(_color0_.g, _shift0_), B0 = _inc_(_color0_.b, _shift0_), A0 = _inc_(_color0_.a, _shift0_);

    // TODO: color matrix support
    ${for16bit ? 
        `fragColor = uvec4(_swap16_(uint(R0 * 65535.f)), _swap16_(uint(G0 * 65535.f)), _swap16_(uint(B0 * 65535.f)), _swap16_(uint(A0 * 65535.f)));` : 
        `fragColor = uvec4(uint(R0 * 255.f), uint(G0 * 255.f), uint(B0 * 255.f), uint(A0 * 255.f));`
    }
}`;

        return [
            createProgram(this.gl, compileShader(this.gl, _vertex_(), this.gl.VERTEX_SHADER), compileShader(this.gl, _fragment_(false), this.gl.FRAGMENT_SHADER)),
            createProgram(this.gl, compileShader(this.gl, _vertex_(), this.gl.VERTEX_SHADER), compileShader(this.gl, _fragment_(true ), this.gl.FRAGMENT_SHADER)),
        ];
    }

    // TODO: using pngjs3 for 16-bit colors
    getImageData(x, y, width, height, options = {}) {
        const u16 = this.is16bit;

        const type = this.gl.getParameter(this.gl.IMPLEMENTATION_COLOR_READ_TYPE, u16 ? this.gl.RGBA16UI : this.gl.RGBA8UI);
        let pixels = null;
        if (type == this.gl.UNSIGNED_INT) {
            pixels = new Uint32Array(width * height * 4);
            if (this.fb) { 
                this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fb); 
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.output);
            };
            this.gl.readPixels(x, y, width, height, this.gl.RGBA_INTEGER, type, pixels, 0);
            if (options.buffer) {
                (new (u16 ? Uint16Array : Uint8Array)(options.buffer, options.byteOffset, width * height * 4)).set(pixels);
            } else {
                const backup = new (u16 ? Uint16Array : Uint8Array)(width * height * 4);
                backup.set(pixels);
                pixels = backup;
            }
        } else {
            pixels = options.buffer ? new (u16 ? Uint16Array : Uint8Array)(options.buffer, options.byteOffset, width * height * 4) : new (u16 ? Uint16Array : Uint8Array)(width * height * 4);
            if (this.fb) { 
                this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fb); 
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.output);
            };
            this.gl.readPixels(x, y, width, height, this.gl.RGBA_INTEGER, type, pixels, 0);
        }
        return {
            width: width,
            height: height,
            data: pixels,
            depth: (u16?16:8)
        };
    }
}

const Instance = new F16_UINT();
export { Instance };
