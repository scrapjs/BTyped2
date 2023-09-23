import * as Gluon from '@gluon-framework/gluon';

// ESM
import path from 'path'
import fs from 'fs'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import autoLoad from '@fastify/autoload'
import cors from '@fastify/cors'

//
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

//
const __filename = fileURLToPath(import.meta.url + "/../")
const __dirname = dirname(__filename)

//
/*const fastify = Fastify({
    logger: true
});*/

export default async function (fastify, options) {

    //
    fastify.addHook('onSend', function (req, reply, payload, next) {
        reply.header("Cross-Origin-Embedder-Policy", "require-corp");
        reply.header("Cross-Origin-Opener-Policy", "same-origin");
        next()
    })

    //
    fastify.register(cors, {
        // put your options here
        hook: 'preHandler',
        delegator: (req, callback) => {
            const corsOptions = {
            // This is NOT recommended for production as it enables reflection exploits
            origin: true
            };
        
            // do not include CORS headers for requests from localhost
            if (/^localhost$/m.test(req.headers.origin)) {
            corsOptions.origin = false
            }
        
            // callback expects two parameters: error and options
            callback(null, corsOptions)
        },
        allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept",
        origin: "*",
        cacheControl: "no-cache"
    })

    // 
    fastify.register(fastifyStatic, {
        prefix: '/', root: path.join(__dirname, 'test'),
        list: true
    });

    // 
    fastify.register(fastifyStatic, {
        prefix: '/test/', root: path.join(__dirname, 'test'),
        decorateReply: false,
        list: true
    });

    // 
    fastify.register(fastifyStatic, {
        prefix: '/src/', root: path.join(__dirname, 'src'),
        decorateReply: false,
        list: true
    });

    //
    ["BTyped2"].map(($n)=>{
        fastify.register(fastifyStatic, {
            prefix: `/${$n}/`, root: path.join(__dirname, `./deps/${$n}/`),
            decorateReply: false,
            list: true
        })
    });

    //
    ["jsox", "@petamoriken", "@msgpack"].map(($n)=>{
        fastify.register(fastifyStatic, {
            prefix: `/${$n}/`, root: path.join(__dirname, `./node_modules/${$n}/`),
            decorateReply: false,
            list: true
        })
    });
}

export const options = {
    ignoreTrailingSlash: true,
    port: 4000
}
