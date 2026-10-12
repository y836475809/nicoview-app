// @ts-nocheck
import { defineConfig } from 'vite';
import riot from 'rollup-plugin-riot'; 
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectAlias = {
    '@lib': path.resolve(__dirname, 'src/lib'),
    '@renderer': path.resolve(__dirname, 'src/renderer')
};

export default defineConfig({
    base: './',
    plugins: [
        riot(),
        electron({
            main: {
                entry: path.resolve(__dirname, 'src/main.js'),
                vite: {
                    resolve: { alias: projectAlias }
                },
                onstart(args) {
                    const { startup } = args;
                    startup(['.', '--no-sandbox', '--dev']);
                }
            },
            preload: {
                input: path.resolve(__dirname, 'src/preload.js'),
            }
        })
    ],
    resolve: {
        alias: projectAlias,
        extensions: ['.js', '.mjs', '.riot'] 
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'src/index.html'),
                player: path.resolve(__dirname, 'src/player.html'),
            }
        }
    },
});
