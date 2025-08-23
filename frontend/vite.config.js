import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000
    },
    allowedHosts: ['exitordieplay.preview.emergentagent.com', 'roguelike-phaser.preview.emergentagent.com', 'roguelikebugfix.preview.emergentagent.com', 'localhost', '0.0.0.0']
  },
  preview: {
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
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
})