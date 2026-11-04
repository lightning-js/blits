import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
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
    alias: {
      // launch.js also supports a sibling renderer checkout. Benchmarks use
      // the installed dependency, including for its version metadata.
      '../../renderer/package.json': fileURLToPath(
        new URL('../node_modules/@lightningjs/renderer/package.json', import.meta.url)
      ),
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
