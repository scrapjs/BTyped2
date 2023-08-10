// UNUSED!
export default class Compositor {
    constructor() {
        
    }

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';

        //
        this.device = device;
        this.adapter = adapter;
        this.presentationFormat = presentationFormat;

        //
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {binding: 0, visibility: 0x2, sampler: { type: "filtering" } },
                {binding: 1, visibility: 0x2, texture: { access: "read-only", format: "rgba8unorm", viewDimension: "2d" } },
                {binding: 2, visibility: 0x2, texture: { access: "read-only", format: "rgba8unorm", viewDimension: "2d" } }
            ]
        });
        
        //
        const clearGroupLayout = device.createBindGroupLayout({
            entries: [
            ]
        });

        //
        this.posBufData = new Float32Array([
            -1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,

            -1.0, -1.0,
             1.0,  1.0,
             1.0, -1.0,
        ]);
        this.posBuf = device.createBuffer({
            size: this.posBufData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(
          this.posBuf,
          0,
          this.posBufData.buffer,
          this.posBufData.byteOffset,
          this.posBufData.byteLength
        );
        
        //
        this.texBufData = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,

            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
        ]);
        this.texBuf = device.createBuffer({
            size: this.texBufData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(
          this.texBuf,
          0,
          this.texBufData.buffer,
          this.texBufData.byteOffset,
          this.texBufData.byteLength
        );

        //
        this.clearpip = device.createRenderPipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [clearGroupLayout]
            }),
            vertex: {
                buffers: [{
                    arrayStride: 4*2,
                    attributes: [{ // position
                          shaderLocation: 0,
                          offset: 0,
                          format: 'float32x2',
                    }],
                }],
                module: device.createShaderModule({ code: `
                struct VertexOutput {
                    @builtin(position) Position : vec4<f32>,
                }
                
                @vertex
                fn main(
                    @location(0) position : vec2<f32>,
                    @builtin(vertex_index) vIndex: u32,
                ) -> VertexOutput {
                    var output : VertexOutput;
                    output.Position = vec4<f32>(position, 0.0, 1.0);
                    return output;
                }
                ` }),
                entryPoint: 'main',
            },
            fragment: {
                module: device.createShaderModule({ code: `
                @fragment
                fn main() -> @location(0) vec4<f32> {
                    return vec4<f32>(0.0f, 0.0f, 0.0f, 0.0f);
                }
` }),
                entryPoint: 'main',
                targets: [{ format: presentationFormat, blend: {
                    color: {
                        operation: "add",
                        srcFactor: "zero",
                        dstFactor: "zero"
                    },
                    alpha: {
                        operation: "add",
                        srcFactor: "zero",
                        dstFactor: "zero"
                    }
                } }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        //
        this.pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            vertex: {
                buffers: [{
                    arrayStride: 4*2,
                    attributes: [{ // position
                          shaderLocation: 0,
                          offset: 0,
                          format: 'float32x2',
                    }],
                }, {
                    arrayStride: 4*2,
                    attributes: [{ // UV
                          shaderLocation: 1,
                          offset: 0,
                          format: 'float32x2',
                    }],
                }],
                module: device.createShaderModule({ code: `
                struct VertexOutput {
                    @builtin(position) Position : vec4<f32>,
                    @location(0) fragUV : vec2<f32>,
                }
                
                @vertex
                fn main(
                    @location(0) position : vec2<f32>,
                    @location(1) uv : vec2<f32>,
                    @builtin(vertex_index) vIndex: u32,
                ) -> VertexOutput {
                    var output : VertexOutput;
                    output.Position = vec4<f32>(position, 0.0, 1.0); 
                    output.fragUV = uv;
                    return output;
                }
                ` }),
                entryPoint: 'main',
            },
            fragment: {
                module: device.createShaderModule({ code: `
                @group(0) @binding(0) var eSampler: sampler;
                @group(0) @binding(1) var RGBtex: texture_2d<f32>;
                @group(0) @binding(2) var Atex: texture_2d<f32>;
                
                @fragment
                fn main(
                    @location(0) fragUV: vec2<f32>
                ) -> @location(0) vec4<f32> {
                    return vec4<f32>(textureSample(RGBtex, eSampler, fragUV).xyz, textureSample(Atex, eSampler, fragUV).x);
                }
` }),
                entryPoint: 'main',
                targets: [{ format: presentationFormat, blend: {
                    color: {
                        operation: "add",
                        srcFactor: "one",
                        dstFactor: "one"
                    },
                    alpha: {
                        operation: "add",
                        srcFactor: "one",
                        dstFactor: "one"
                    }
                } }],
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        return this;
    }

    // composite for PNG encoding
    async composite(W, H, RGBp, Ap) {
        this.W = W, this.H = H;

        //
        const device = this.device;
        const canvas = new OffscreenCanvas(W, H);
        const context = canvas.getContextDeepSpace('webgpu', {
            premultipliedAlpha: true,
            preserveDrawingBuffer: true
        });
        context.configure({
            device,
            format: this.presentationFormat,
            alphaMode: 'premultiplied',
        });

        //
        const RGB = await createImageBitmap(await RGBp, {
            colorSpaceConversion: "none",
            resizeQuality: "pixelated"
        });
        const A = await createImageBitmap(await Ap, {
            colorSpaceConversion: "none",
            resizeQuality: "pixelated"
        });
        
        //
        const RGBtex = device.createTexture({
            size: [RGB.width, RGB.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const Atex = device.createTexture({
            size: [A.width, A.height, 1],
            format: 'r8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //
        device.queue.copyExternalImageToTexture({ source: RGB }, { texture: RGBtex }, [RGB.width, RGB.height]);
        device.queue.copyExternalImageToTexture({ source: A }, { texture: Atex }, [A.width, A.height]);
        
        //
        const uniformBufferSize = 8;
        const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        //
        const sampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });

        //
        const uniformBindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: sampler,
                    visibility: 0x3
                },
                {
                    binding: 1,
                    resource: RGBtex.createView(),
                    visibility: 0x3
                },
                {
                    binding: 2,
                    resource: Atex.createView(),
                    visibility: 0x3
                },
            ],
        });
        
        //
        const clearBindGroup = device.createBindGroup({
            layout: this.clearpip.getBindGroupLayout(0),
            entries: [],
        });
        
        //
        var SIZE = new Uint32Array([this.W, this.H]);
        device.queue.writeBuffer(
            uniformBuffer, 0,
            SIZE.buffer,
            SIZE.byteOffset,
            SIZE.byteLength
        );

        //
        const textureView = context.getCurrentTexture().createView();
        const commandEncoder = device.createCommandEncoder();
        const renderPassDescriptor = { colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                loadOp: 'load',
                storeOp: 'store',
                loadValue: 'load',
            },
        ]};
        const clearPassDescriptor = { colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                loadOp: 'load',
                storeOp: 'store',
                loadValue: 'load',
            },
        ]};

        //
        const clearEncoder = commandEncoder.beginRenderPass(clearPassDescriptor);
        clearEncoder.setVertexBuffer(0, this.posBuf);
        clearEncoder.setPipeline(this.clearpip);
        clearEncoder.setBindGroup(0, clearBindGroup);
        clearEncoder.draw(6, 1, 0, 0);
        if (clearEncoder.end) { clearEncoder.end(); }

        //
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setVertexBuffer(0, this.posBuf);
        passEncoder.setVertexBuffer(1, this.texBuf);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.draw(6, 1, 0, 0);
        if (passEncoder.end) { passEncoder.end(); }
        
        //
        device.queue.submit([commandEncoder.finish()]);
        
        //
        if (device.queue.onSubmittedWorkDone) { await device.queue.onSubmittedWorkDone(); } //else { await new Promise(requestAnimationFrame); }

        // encode as raw PNG image
        /*const blob = await (canvas.convertToBlob || canvas.toBlob).call(canvas, {type: "image/png"});
        const FR = new FileReader();
        FR.readAsArrayBuffer(blob);
        const READ = new Promise(resolve => {
            FR.onload = ()=>resolve(FR.result);
        });
        return await READ;*/

        return canvas;//canvas.transferToImageBitmap();
    }
}