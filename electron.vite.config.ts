import vue from '@vitejs/plugin-vue';
import {
  bytecodePlugin,
  defineConfig,
  externalizeDepsPlugin,
  splitVendorChunkPlugin,
} from 'electron-vite';
import {resolve} from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [vue(), splitVendorChunkPlugin()],
  },
});
