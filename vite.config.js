import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';
import fs from 'fs';

// Check if there's a cookie-consent.js file in the src directory root
const rootMainFile = fs.existsSync(resolve(__dirname, 'src/cookie-consent.js'))
    ? { root: resolve(__dirname, 'src/cookie-consent.js') }
    : {};

// Gather versioned folders in src directory
const versionFolders = fs
    .readdirSync(resolve(__dirname, 'src'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

export default defineConfig({
    plugins: [cssInjectedByJsPlugin()],
    build: {
        target: 'es2015',
        rollupOptions: {
            input: {
                ...rootMainFile,
                ...Object.fromEntries(
                    versionFolders.map((version) =>{
                        const tsPath = resolve(__dirname, `src/${version}/cookie-consent.ts`);
                        const jsPath = resolve(__dirname, `src/${version}/cookie-consent.js`);
                        return [
                            version,
                            fs.existsSync(tsPath) ? tsPath : jsPath,
                        ];
                    }))
            },
            output: {
                entryFileNames: ({ name }) => (name === 'root' ? 'cookie-consent.js' : `${name}/cookie-consent.js`),
                manualChunks: undefined,
                dir: resolve(__dirname, 'dist')
            }
        },
        sourcemap: false,
        minify: 'terser'
    }
});
