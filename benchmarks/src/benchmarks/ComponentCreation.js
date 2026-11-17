import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const columns = 34

// Match the element benchmark content, adding only the component boundary.
const Item = Blits.Component('ComponentCreationItem', {
  props: ['content', 'color'],
  template: `
    <Element w="50" h="30" color="$color">
      <Text content="$content" size="10" />
    </Element>
  `,
})

export const title = 'Component generation benchmark'

export default Blits.Component('ComponentCreation', {
  components: { Item },
  template: `
  <Element x="30" y="30">
    <Item :for="item in $items" key="$item.id" x="$item.x" y="$item.y" color="$item.color" content="$item.id" />
  </Element>
`,
  state() {
    return { items: [] }
  },

  methods: {
    async setup({ size }) {
      if (this.items.length > 0) {
        await untilIdle(() => {
          this.items = []
        })
      } else {
        await untilIdle()
      }
      // Prepare data outside timing; each assignment starts from an empty loop.
      return Array.from({ length: size }, (_, item) => ({
        id: `item-${item}`,
        x: (item % columns) * 55,
        y: Math.floor(item / columns) * 34,
        color: item % 2 === 0 ? '#334155' : '#475569',
      }))
    },
    async measure(items) {
      let start
      let generationSyncMs
      await untilIdle(() => {
        start = performance.now()
        this.items = items
        generationSyncMs = performance.now() - start
      })
      return { generationSyncMs, totalToIdleMs: performance.now() - start }
    },
    verify({ size }) {
      const rendered = Object.values(this[symbols.children][2] || {})
      if (
        rendered.length !== size ||
        rendered.some((component) => component.$componentId === undefined || component.eol === true)
      ) {
        throw new Error(`Expected ${size} live components, found ${rendered.length}`)
      }
    },
  },
})
