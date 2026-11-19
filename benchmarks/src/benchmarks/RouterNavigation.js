import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle } from '../benchmark-utils.js'

const EmptyPage = Blits.Component('RouterNavigationEmptyPage', {
  template: '<Element />',
})

// Kept to a single text, so results reflect the router rather than rendering work.
const PopulatedPage = Blits.Component('RouterNavigationPopulatedPage', {
  template: `
    <Element>
      <Text content="Populated page" />
    </Element>
  `,
})

// Skips the route animation. Only `out` is set: a zero-duration `in` would never finish.
const noTransition = { out: { prop: 'alpha', value: 0, duration: 0 } }
const options = { inHistory: false }

// The last completed navigation (set by afterEach) and the page it navigated away from.
let navigated
let previous

export const createRouterNavigation = (transition) =>
  Blits.Component('RouterNavigation', {
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
          navigated = { path: to.path, at: performance.now() }
        },
      },
    },

    methods: {
      async navigate(path) {
        previous = this.$select('router').activeView
        navigated = undefined
        let start
        await untilIdle(() => {
          start = performance.now()
          this.$router.to(path)
        })
        return start
      },
      // Throws unless navigation to `path` finished, its page is the only live one, and the
      // page navigated away from has released its resources (also after a transition).
      check(path) {
        const router = this.$select('router')
        const page = router.activeView
        if (
          navigated?.path !== path ||
          this.$router.currentRoute?.path !== path ||
          this.$router.navigating !== false
        ) {
          throw new Error(`Expected navigation to ${path} to be complete`)
        }
        if (!page || page.eol === true || router[symbols.children].length !== 2) {
          throw new Error(`Expected a single live page on ${path}`)
        }
        if (previous && (previous.eol !== true || previous[symbols.children] !== undefined)) {
          throw new Error('Expected the previous page and its resources to be released')
        }
        return page
      },

      async setup() {
        await untilIdle()
        // Navigating to the current route does nothing and would never go idle.
        if (this.$router.currentRoute?.path !== '/empty') await this.navigate('/empty')
        this.check('/empty')
      },
      async measure() {
        const start = await this.navigate('/populated')
        const totalToIdleMs = performance.now() - start
        // Until the router finished navigating, including the transition when animated.
        return { generationSyncMs: navigated?.at - start, totalToIdleMs }
      },
      verify() {
        // Next to its wrapper the populated page holds its text; the empty page holds nothing.
        if (this.check('/populated')[symbols.children][1] === undefined) {
          throw new Error('Expected the populated page content to exist')
        }
      },
    },
  })

export const title = 'Router navigation benchmark'

export default createRouterNavigation(noTransition)
