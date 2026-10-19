import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import blitsVitePlugins from '@lightningjs/blits/vite'

export default defineConfig({
  base: './',
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
