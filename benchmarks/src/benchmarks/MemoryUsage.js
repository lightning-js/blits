import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const columns = 34

// Match the component-creation workload shape, so memory figures are
// comparable to that benchmark's timing figures.
const Item = Blits.Component('MemoryUsageItem', {
  props: ['content', 'color'],
  template: `
    <Element w="50" h="30" color="$color">
      <Text content="$content" size="10" />
    </Element>
  `,
})

export const title = 'Memory usage benchmark'

export default Blits.Component('MemoryUsage', {
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
    async mount(size) {
      const items = Array.from({ length: size }, (_, item) => ({
        id: `item-${item}`,
        x: (item % columns) * 55,
        y: Math.floor(item / columns) * 34,
        color: item % 2 === 0 ? '#334155' : '#475569',
      }))
      await untilIdle(() => {
        this.items = items
      })
    },
    async unmount() {
      if (this.items.length === 0) {
        await untilIdle()
        return
      }
      await untilIdle(() => {
        this.items = []
      })
    },
    verifyMounted(size) {
      const rendered = Object.values(this[symbols.children][2] || {})
      if (
        rendered.length !== size ||
        rendered.some((component) => component.$componentId === undefined || component.eol === true)
      ) {
        throw new Error(`Expected ${size} live components, found ${rendered.length}`)
      }
    },
    verifyUnmounted() {
      const rendered = Object.values(this[symbols.children][2] || {})
      if (rendered.length !== 0) {
        throw new Error(`Expected 0 live components after unmount, found ${rendered.length}`)
      }
    },
  },
})
