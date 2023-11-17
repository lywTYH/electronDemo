import {join} from 'node:path';
import {chrome} from '../../.electron-vendors.cache.json';
import {injectAppVersion} from '../../version/inject-app-version-plugin.mjs';
const PACKAGE_ROOT = __dirname;
const PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
const isProd = process.env.MODE === 'production';
/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  build: {
    ssr: true,
    sourcemap: isProd,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: isProd,
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [injectAppVersion()],
};

export default config;
