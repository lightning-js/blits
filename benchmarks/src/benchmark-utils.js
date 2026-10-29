export const getManualOptions = () => {
  const query = new URLSearchParams(window.location.search)
  return {
    size: Number(query.get('size') ?? 1000),
    warmup: Number(query.get('warmup') ?? 5),
    samples: Number(query.get('samples') ?? 20),
  }
}

let isIdle = false
let idleWaiter

export const untilIdle = (update) => {
  // Start each update from idle so it can produce its own active -> idle transition.
  if (update && !isIdle) return untilIdle().then(() => untilIdle(update))
  if (!update && isIdle) return Promise.resolve()
  return new Promise((resolve, reject) => {
    // Updates must produce their own active -> idle transition.
    let sawActive = !update
    let idleEvents = 0
    const cleanup = () => {
      clearTimeout(timeout)
      idleWaiter = undefined
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(
        new Error(
          `Renderer did not become idle within 30 seconds (update: ${Boolean(update)}, active observed: ${sawActive}, idle events: ${idleEvents}, last idle state: ${isIdle})`
        )
      )
    }, 30_000)
    idleWaiter = (idle) => {
      if (idle) idleEvents++
      if (!idle) sawActive = true
      if (idle && sawActive) {
        cleanup()
        resolve()
      }
    }
    try {
      update?.()
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

export const updateIdle = (idle) => {
  isIdle = idle
  idleWaiter?.(idle)
}

const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export const validateOptions = ({ size, warmup, samples }) => {
  for (const [name, value] of Object.entries({ size, warmup, samples })) {
    if (!Number.isSafeInteger(value) || value < (name === 'warmup' ? 0 : 1)) {
      throw new Error(
        `${name} must be ${name === 'warmup' ? 'a non-negative' : 'a positive'} integer`
      )
    }
  }
}

export const summarizeResults = ({ title, size, warmup, samples }, results) => {
  const syncTimes = results.map((result) => result.generationSyncMs)
  const idleTimes = results.map((result) => result.totalToIdleMs)
  return {
    title,
    size,
    warmup,
    samples,
    medianGenerationSyncMs: median(syncTimes),
    averageGenerationSyncMs: syncTimes.reduce((sum, value) => sum + value, 0) / samples,
    minGenerationSyncMs: Math.min(...syncTimes),
    maxGenerationSyncMs: Math.max(...syncTimes),
    medianTotalToIdleMs: median(idleTimes),
    averageTotalToIdleMs: idleTimes.reduce((sum, value) => sum + value, 0) / samples,
    minTotalToIdleMs: Math.min(...idleTimes),
    maxTotalToIdleMs: Math.max(...idleTimes),
    results,
  }
}

export const logResults = (summary) => {
  const { title, size, warmup, samples, results } = summary
  console.group(title)
  console.table({
    size: { value: size },
    warmup: { value: warmup },
    samples: { value: samples },
  })
  console.table({
    'Synchronous generation (ms)': {
      median: summary.medianGenerationSyncMs,
      average: summary.averageGenerationSyncMs,
      min: summary.minGenerationSyncMs,
      max: summary.maxGenerationSyncMs,
    },
    'Total time to idle (ms)': {
      median: summary.medianTotalToIdleMs,
      average: summary.averageTotalToIdleMs,
      min: summary.minTotalToIdleMs,
      max: summary.maxTotalToIdleMs,
    },
  })
  console.log('Samples', results)
  console.groupEnd()
}

let running = false

export const runBenchmark = async ({
  title = 'Benchmark',
  size = 1000,
  warmup = 5,
  samples = 20,
  setup,
  measure,
  verify,
}) => {
  if (running) throw new Error('Benchmark is already running')
  const options = { title, size, warmup, samples }
  validateOptions(options)
  running = true
  try {
    const results = []
    for (let index = 0; index < warmup + samples; index++) {
      let phase = 'setup'
      try {
        const prepared = await setup(options)
        phase = 'measure'
        const result = await measure(prepared)
        phase = 'verify'
        await verify(options)
        if (index >= warmup) results.push(result)
      } catch (error) {
        const repetition =
          index < warmup
            ? `warmup ${index + 1}/${warmup}`
            : `sample ${index - warmup + 1}/${samples}`
        throw new Error(`${title}: ${repetition}, ${phase}: ${error.message}`, { cause: error })
      }
    }
    const summary = summarizeResults(options, results)
    logResults(summary)
    return summary
  } finally {
    running = false
  }
}

export const validateCpuSlowdown = (rate) => {
  if (!Number.isFinite(rate) || rate < 1) {
    throw new Error('CPU slowdown must be a finite number greater than or equal to 1')
  }
}
