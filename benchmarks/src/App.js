import Blits from '@lightningjs/blits'
import { updateIdle, runBenchmark, getManualOptions } from './benchmark-utils.js'

export default (component, title) =>
  Blits.Application({
    components: { Workload: component },
    template: `
      <Element>
        <Workload ref="workload" />
      </Element>
    `,
    state() {
      return { benchmarkRunning: false }
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
        const workload = this.$select('workload')
        // Memory workloads expose mount/unmount instead of setup/measure/verify.
        // They're called individually by the Node-side runner so it can force a
        // GC and read the heap size between each step.
        const isMemoryWorkload =
          typeof workload.mount === 'function' && typeof workload.unmount === 'function'
        if (isMemoryWorkload) {
          window.__BLITS_BENCH__ = {
            ready: true,
            mount: async (size) => {
              await workload.mount(size)
              workload.verifyMounted(size)
            },
            unmount: async () => {
              await workload.unmount()
              workload.verifyUnmounted()
            },
          }
          return
        }
        const run = async (options = {}) => {
          if (this.benchmarkRunning) return
          this.benchmarkRunning = true
          try {
            return await runBenchmark({
              ...options,
              title,
              setup: workload.setup.bind(workload),
              measure: workload.measure.bind(workload),
              verify: workload.verify.bind(workload),
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
