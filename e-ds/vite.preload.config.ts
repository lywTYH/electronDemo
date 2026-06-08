import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Avoid naming collision with the main process entry (both are index.ts).
        entryFileNames: 'preload.js',
      },
    },
  },
});
