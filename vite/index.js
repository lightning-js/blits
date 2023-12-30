import preCompiler from './preCompiler.js'
import { importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'

export { importChunkUrl as importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'
export { default as preCompiler } from './preCompiler.js'

export default [importChunkUrl(), preCompiler()]
