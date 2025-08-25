// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Make sure relative asset paths work in the itch zip
  base: './',

  server: {
    host: '0.0.0.0',
    port: 3000,
    // optional – only if you really need it
    allowedHosts: ['exitordieplay.preview.emergentagent.com'],
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
    // optional – mirror server.allowedHosts if you need it
    allowedHosts: ['exitordieplay.preview.emergentagent.com'],
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
});