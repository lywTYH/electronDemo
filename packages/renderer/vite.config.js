/* global __dirname process */
import {join} from 'node:path';
// import vue from '@vitejs/plugin-vue';
// import {renderer} from 'unplugin-auto-expose';
import {chrome} from '../../.electron-vendors.cache.json';
import {injectAppVersion} from '../../version/inject-app-version-plugin.mjs';

const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: false,
    minify: false,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: join(PACKAGE_ROOT, 'index.html'),
    },
    emptyOutDir: true,
    reportCompressedSize: false,
    watch: {
      clearScreen: true,
    },
  },
  test: {
    environment: 'happy-dom',
  },
  plugins: [
    // vue(),
    // renderer.vite({
    //   preloadEntry: join(PACKAGE_ROOT, '../preload/src/index.ts'),
    // }),
    injectAppVersion(),
  ],
};

export default config;
