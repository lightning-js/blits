import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const List = Blits.Component('ComputedLoopList', {
  props: { items: [] },
  template: `
    <Element>
      <Element :for="item in $visibleItems" key="$item.id" x="$item.x" y="$item.y" color="$item.color" w="50" h="30">
        <Text content="$item.id" size="10" />
      </Element>
    </Element>
  `,
  computed: {
    visibleItems() {
      return this.items.filter(() => true)
    },
  },
})

export const title = 'Computed loop creation benchmark'

export default Blits.Component('ComputedLoopCreation', {
  components: { List },
  template: `
    <Element x="30" y="30">
      <List :for="list in $lists" key="$list.id" items="$list.items" />
    </Element>
  `,
  state() {
    return { lists: [] }
  },
  methods: {
    async setup({ size }) {
      if (this.lists.length) {
        await untilIdle(() => {
          this.lists = []
        })
      } else {
        await untilIdle()
      }
      const items = Array.from({ length: size }, (_, item) => ({
        id: `item-${item}`,
        x: (item % 34) * 55,
        y: Math.floor(item / 34) * 34,
        color: item % 2 === 0 ? '#334155' : '#475569',
      }))
      // Populate the prop before mounting, so unfixed versions perform the same work.
      return [{ id: 'list', items }]
    },
    async measure(lists) {
      let start
      let generationSyncMs
      await untilIdle(() => {
        start = performance.now()
        this.lists = lists
        generationSyncMs = performance.now() - start
      })
      return { generationSyncMs, totalToIdleMs: performance.now() - start }
    },
    verify({ size }) {
      const list = Object.values(this[symbols.children][2] || {})[0]
      if (!list?.$componentId || list.eol) throw new Error('Expected a live computed list')
      const rendered = Object.values(list[symbols.children][1] || {})
      if (rendered.length !== size || rendered.some((element) => element.eol)) {
        throw new Error(`Expected ${size} live Elements in the computed loop`)
      }
    },
  },
})
