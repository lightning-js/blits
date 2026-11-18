import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const columns = 34

// Match the component-creation item, so the populated page only adds the router on top.
const Item = Blits.Component('RouterNavigationItem', {
  props: ['content', 'color'],
  template: `
    <Element w="50" h="30" color="$color">
      <Text content="$content" size="10" />
    </Element>
  `,
})

// Prepared in setup(), outside the timed region; the populated page only reads it.
let cache = { size: 0, items: [] }
const prepareItems = (size) => {
  if (cache.size !== size) {
    cache = {
      size,
      items: Array.from({ length: size }, (_, item) => ({
        id: `item-${item}`,
        x: (item % columns) * 55,
        y: Math.floor(item / columns) * 34,
        color: item % 2 === 0 ? '#334155' : '#475569',
      })),
    }
  }
  return cache.items
}

// Set by the router's afterEach hook and the populated page's ready hook.
let navigatedTo
let pageReadyAt

const EmptyPage = Blits.Component('RouterNavigationEmptyPage', {
  template: '<Element w="1920" h="1080" />',
})

const PopulatedPage = Blits.Component('RouterNavigationPopulatedPage', {
  components: { Item },
  props: ['size'],
  template: `
    <Element x="30" y="30">
      <Item :for="item in $items" key="$item.id" x="$item.x" y="$item.y" color="$item.color" content="$item.id" />
    </Element>
  `,
  state() {
    // Blits calls state() once with props still undefined to discover the state keys.
    return { items: this.size > 0 ? prepareItems(this.size) : [] }
  },
  hooks: {
    ready() {
      pageReadyAt = performance.now()
    },
  },
})

// The default route transition is a 200 ms fade that CPU throttling does not scale.
// A zero-duration, out-only transition skips it (a zero-duration `in` would hang navigation).
const transition = { out: { prop: 'alpha', value: 0, duration: 0 } }
const options = { inHistory: false }

const liveItems = (page) => Object.values(page[symbols.children]?.[2] || {})

export const title = 'Router navigation benchmark'

export default Blits.Component('RouterNavigation', {
  template: `
    <Element>
      <RouterView ref="router" />
    </Element>
  `,
  router: {
    routes: [
      { path: '/empty', component: EmptyPage, transition, options },
      { path: '/populated', component: PopulatedPage, transition, options },
    ],
    hooks: {
      init() {
        // Without this the empty hash resolves to the unmatched route '/'.
        location.hash = '/empty'
      },
      afterEach(to) {
        navigatedTo = to.path
      },
    },
  },

  methods: {
    navigate(path, data) {
      navigatedTo = undefined
      this.$router.to(path, data)
    },
    // Navigation finished on `path` and the RouterView holds only that live page.
    checkRoute(path) {
      const router = this.$select('router')
      const page = router.activeView
      if (
        navigatedTo !== path ||
        this.$router.currentRoute?.path !== path ||
        this.$router.navigating !== false
      ) {
        throw new Error(`Expected navigation to ${path} to be complete`)
      }
      if (page === undefined || page.eol === true || router[symbols.children].length !== 2) {
        throw new Error(`Expected a single live page on ${path}`)
      }
      return page
    },

    async setup({ size }) {
      const router = this.$select('router')
      await untilIdle()
      prepareItems(size)
      // Navigating to the current route does nothing and would never go idle.
      if (this.$router.currentRoute?.path !== '/empty') {
        const previous = router.activeView
        const previousItems = liveItems(previous)
        await untilIdle(() => this.navigate('/empty'))
        if (previous.eol !== true || previousItems.some((item) => item.eol !== true)) {
          throw new Error('Expected the previous page and its components to be destroyed')
        }
      }
      this.checkRoute('/empty')
      return { size }
    },
    async measure({ size }) {
      let start
      pageReadyAt = 0
      await untilIdle(() => {
        start = performance.now()
        this.navigate('/populated', { size })
      })
      const totalToIdleMs = performance.now() - start
      if (pageReadyAt < start) {
        throw new Error('Expected the populated page to become ready during navigation')
      }
      // Time until the populated page and its items exist (the router starts on hashchange).
      return { generationSyncMs: pageReadyAt - start, totalToIdleMs }
    },
    verify({ size }) {
      const rendered = liveItems(this.checkRoute('/populated'))
      if (
        rendered.length !== size ||
        rendered.some((component) => component.$componentId === undefined || component.eol === true)
      ) {
        throw new Error(`Expected ${size} live components, found ${rendered.length}`)
      }
    },
  },
})
