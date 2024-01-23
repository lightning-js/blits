import { importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'

import preCompiler from './preCompiler.js'
import msdfGenerator from './msdfGenerator.js'

export { importChunkUrl as importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'
export { default as preCompiler } from './preCompiler.js'
export { default as msdfGenerator } from './msdfGenerator.js'

export default [importChunkUrl(), preCompiler(), msdfGenerator()]
