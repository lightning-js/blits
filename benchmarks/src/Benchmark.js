import Blits from '@lightningjs/blits'
import symbols from '@lightningjs/blits/symbols'
import { untilIdle, updateIdle, runBenchmark, getManualOptions } from './benchmark-utils.js'

const columns = 34

export default Blits.Application({
  template: `
    <Element x="30" y="30">
      <Element :for="item in $items" key="$item.id" x="$item.x" y="$item.y" color="$item.color" w="50" h="30">
        <Text content="$item.id" size="10" />
      </Element>
    </Element>
  `,
  state() {
    return { items: [], benchmarkRunning: false }
  },
  input: {
    async enter(event) {
      if (event.repeat || this.benchmarkRunning || !this.runBenchmark) return
      event.preventDefault()
      try {
        await this.runBenchmark(getManualOptions())
      } catch (error) {
        console.error(error)
      }
    },
  },
  hooks: {
    idle(idle) {
      updateIdle(idle)
    },
    ready() {
      const run = async (options = {}) => {
        if (this.benchmarkRunning) return
        this.benchmarkRunning = true
        try {
          return await runBenchmark({
            ...options,
            title: 'Element generation benchmark',
            setup: async ({ size }) => {
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
            measure: async (items) => {
              let start
              let generationSyncMs
              await untilIdle(() => {
                start = performance.now()
                this.items = items
                generationSyncMs = performance.now() - start
              })
              return { generationSyncMs, totalToIdleMs: performance.now() - start }
            },
            verify: ({ size }) => {
              const rendered = Object.values(this[symbols.children][1] || {})
              if (rendered.length !== size || rendered.some((element) => element.eol === true)) {
                throw new Error(`Expected ${size} live Elements, found ${rendered.length}`)
              }
            },
          })
        } finally {
          this.benchmarkRunning = false
        }
      }
      this.runBenchmark = run
      window.__BLITS_BENCH__ = { ready: true, run }
    },
  },
})
