// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // needed so the dist/ zip works on itch.io
  server: {
    host: true,        // listen on all interfaces
    allowedHosts: true // allow any host in dev (incl. *.preview.emergentagent.com)
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true // critical for Emergent preview host
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  }
})