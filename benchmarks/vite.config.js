import { defineConfig } from 'vite'
import blitsVitePlugins from '@lightningjs/blits/vite'

// Allow high-resolution performance.now() timestamps for short operations.
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

export default defineConfig({
  base: './',
  server: { headers },
  preview: { headers },
  plugins: [...blitsVitePlugins],
  resolve: {
    mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
