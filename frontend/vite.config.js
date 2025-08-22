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