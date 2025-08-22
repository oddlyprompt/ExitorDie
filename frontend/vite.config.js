import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: {
      port: 3000
    },
    allowedHosts: 'all'
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all'
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
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // so itch.io build works
  server: {
    host: true,                // listen on all addresses
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.preview.emergentagent.com', // allow all Emergent preview hosts
'roguelike-phaser.preview.emergentagent.com',
    ]
  }
})