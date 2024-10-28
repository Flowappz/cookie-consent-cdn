import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
    plugins: [cssInjectedByJsPlugin()],
    build: {
        target: 'es2015',
        rollupOptions: {
            output: {
                entryFileNames: 'index.js',
                manualChunks: undefined,
            },
        },
        sourcemap: false,
        minify: 'terser',
    },
})
