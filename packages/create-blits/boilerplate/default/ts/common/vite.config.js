/// <reference types="vite/client" />

import { defineConfig } from 'vite'
// @ts-expect-error
import blitsVitePlugins from '@lightningjs/blits/vite'

/** @type {NonNullable<import('vite').UserConfig['worker']>['format']} */
const format = 'es'
/** @type {import('vite').PluginOption} */
const plugins = [...blitsVitePlugins]

export default defineConfig(() => {
  return {
    base: '/', // Set to your base path if you are deploying to a subdirectory (example: /myApp/)
    plugins,
    resolve: {
      mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      fs: {
        allow: ['..'],
      },
    },
    worker: {
      format,
    },
  }
})
