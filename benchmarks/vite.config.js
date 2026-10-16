import { defineConfig } from 'vite'
import blitsVitePlugins from '@lightningjs/blits/vite'

export default defineConfig({
  base: './',
  plugins: [...blitsVitePlugins],
  resolve: { mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'] },
  build: { outDir: 'dist', emptyOutDir: true },
})
