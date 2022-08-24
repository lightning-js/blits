import { createNode } from '@lightningjs/lightning-renderer/index.js'
import { normalizeARGB } from '@lightningjs/lightning-renderer/lib/utils.js'

const stage = {
  createElement: createNode,
  normalizeARGB,
}

export default stage
