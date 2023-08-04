import { defineConfig, loadEnv } from 'vite'
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import { VitePWA } from 'vite-plugin-pwa'

//
export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')
    return {
        // vite config
        port: 4000,
        base: "./",
        define: {
          __APP_ENV__: JSON.stringify(env.APP_ENV),
        },
        cors: true,
        worker: {
          format: "es"
        },
        plugins: [
          VitePWA({
            injectRegister: "auto"
          }),
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
