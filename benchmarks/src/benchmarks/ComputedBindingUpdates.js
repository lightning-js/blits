import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const passes = 20
const Item = Blits.Component('ComputedBindingItem', {
  template: '<Element :x="$computedPosition" w="50" h="30" color="#a78bfa" />',
  state() {
    return { position: 0 }
  },
  computed: {
    computedPosition() {
      return this.position
    },
  },
})

export const title = 'Computed binding updates benchmark (20 passes)'

export default Blits.Component('ComputedBindingUpdates', {
  components: { Item },
  template: `
    <Element x="30" y="30">
      <Item :for="item in $items" key="$item.id" x="$item.x" y="$item.y" />
    </Element>
  `,
  state() {
    return { items: [] }
  },
  methods: {
    async setup({ size }) {
      if (this.items.length !== size) {
        if (this.items.length) {
          await untilIdle(() => {
            this.items = []
          })
        }
        const items = Array.from({ length: size }, (_, item) => ({
          id: `item-${item}`,
          x: (item % 34) * 55,
          y: Math.floor(item / 34) * 34,
        }))
        // Mount through a direct array loop; only ordinary computed bindings are timed.
        await untilIdle(() => {
          this.items = items
        })
        this.targets = Object.values(this[symbols.children][2] || {})
        if (this.targets.length !== size || this.targets.some((child) => !child.$componentId)) {
          throw new Error(`Expected ${size} child components`)
        }
      }
      if (this.targets[0].position !== 0) {
        await untilIdle(() => {
          for (const child of this.targets) child.position = 0
        })
      } else {
        await untilIdle()
      }
      return this.targets
    },
    async measure(targets) {
      let start
      let generationSyncMs
      await untilIdle(() => {
        start = performance.now()
        for (let pass = 0; pass < passes; pass++) {
          const position = (pass % 2) * 10 + 2
          for (const child of targets) child.position = position
        }
        generationSyncMs = performance.now() - start
      })
      return { generationSyncMs, totalToIdleMs: performance.now() - start }
    },
    verify({ size }) {
      const expected = ((passes - 1) % 2) * 10 + 2
      if (
        this.targets.length !== size ||
        this.targets.some((child) => child.eol || child[symbols.children][0].node.x !== expected)
      ) {
        throw new Error(`Expected ${size} live components at position ${expected}`)
      }
    },
  },
})
