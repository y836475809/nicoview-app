// @ts-nocheck
import { defineConfig } from 'electron-vite';
import riot from 'rollup-plugin-riot'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectAlias = {
    '@main': path.resolve(__dirname, 'src/main'),
    '@lib': path.resolve(__dirname, 'src/lib'),
    '@renderer': path.resolve(__dirname, 'src/renderer/src')
};

export default defineConfig({
  main: {
    resolve: {
      alias: projectAlias
    }
  },
  preload: {
    resolve: {
      alias: projectAlias
    }
  },
  renderer: {
    plugins: [riot()],
    resolve: {
      alias: projectAlias
    },
    extensions: ['.js', '.mjs', '.riot'],
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/renderer/index.html'),
          player: path.resolve(__dirname, 'src/renderer/player.html'),
        }
      }
    }
  }
});
