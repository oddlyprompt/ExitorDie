// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // needed so the dist/ zip works on itch.io
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000
    },
    allowedHosts: ['exitordieplay.preview.emergentagent.com', 'roguelike-phaser.preview.emergentagent.com', 'roguelikebugfix.preview.emergentagent.com', 'localhost', '0.0.0.0']
  },
  preview: {
    host: true,
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['exitordieplay.preview.emergentagent.com', 'roguelike-phaser.preview.emergentagent.com', 'roguelikebugfix.preview.emergentagent.com', 'localhost', '0.0.0.0']
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