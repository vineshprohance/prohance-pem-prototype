import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@config': fileURLToPath(new URL('./config', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    // one JS chunk and one CSS file keeps scripts/build-standalone.mjs simple
    rollupOptions: { output: { manualChunks: undefined, inlineDynamicImports: true } },
  },
  server: { port: 5173, open: true },
})
