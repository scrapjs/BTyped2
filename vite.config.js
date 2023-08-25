import { defineConfig, loadEnv } from 'vite'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import { VitePWA } from 'vite-plugin-pwa'
import pugPlugin from 'vite-plugin-pug'
import { fileURLToPath, URL } from "url";

//
export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')
    return {
        // vite config
        port: 4000,
        base: "./",
        root: "./src/",
        build: {
          outDir: './dist/',
          rollupOptions: {
            input: {
              // need a better way to template
              main: "./src/index.html",
            },
          },
        },
        css: {
          modules: {
            scopeBehaviour: "global"
          },
          preprocessorOptions: {
            scss: {

            }
          }
        },
        include: ["src/**/*", "src/*", "*"],
        server: { fs: { allow: ['./','./deps','../']} },
        resolve: {
          alias: {
            "BTyped2": fileURLToPath(new URL("./deps/BTyped2/", import.meta.url)),

            //
            "cxx": fileURLToPath(new URL("./src/cxx", import.meta.url)),
            "scss": fileURLToPath(new URL("./src/scss", import.meta.url)),
            "css": fileURLToPath(new URL("./src/css", import.meta.url)),
            "js": fileURLToPath(new URL("./src/js", import.meta.url)),
            "src": fileURLToPath(new URL("./src/", import.meta.url)),
            "deps": fileURLToPath(new URL("./deps/", import.meta.url)),
            "test": fileURLToPath(new URL("./test/", import.meta.url)),
            "node_modules": fileURLToPath(new URL("./node_modules/", import.meta.url)),
            "~": fileURLToPath(new URL("./node_modules/", import.meta.url)),
            "@": fileURLToPath(new URL("./node_modules/", import.meta.url)),
          }
        },
        define: {
          __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
        cors: true,
        worker: {
          format: "es"
        },
        plugins: [
          VitePWA({ injectRegister: "auto" }),
          pugPlugin(undefined, { pagesUrl: './dist/' }),
          {
            name: "configure-response-headers",
            configureServer: (server) => {
              server.middlewares.use((_req, res, next) => {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Service-Worker-Allowed", "/");
                next();
              });
            },
          },
        ],
    }
})
