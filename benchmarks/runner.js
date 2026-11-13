import { fileURLToPath, pathToFileURL } from 'node:url'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { requireBenchmarkSupport } from './src/support.js'
import { runSuite } from './suite.js'
import { validateOptions, validateCpuSlowdown } from './src/benchmark-utils.js'
import { formatSummary, formatSuiteSummary, formatShortSummary } from './summary.js'
import { benchmarks, defaultBenchmark, validateBenchmark, isMemoryBenchmark } from './benchmarks.js'
import {
  DEFAULT_MEMORY_SIZE,
  validateMemorySize,
  summarizeMemory,
  formatMemorySummary,
} from './memory.js'
import viteConfig from './vite.config.js'

const benchmarkRoot = fileURLToPath(new URL('.', import.meta.url))
export const buildBenchmark = async (sourceRoot, outDir) => {
  // Resolve public Blits imports against this snapshot; keep one toolchain.
  const pkg = JSON.parse(await readFile(resolve(sourceRoot, 'package.json'), 'utf8'))
  const aliases = Object.entries(pkg.exports)
    .map(([name, entry]) => ({
      find: name === '.' ? '@lightningjs/blits' : `@lightningjs/blits/${name.slice(2)}`,
      replacement: resolve(sourceRoot, typeof entry === 'string' ? entry : entry.default),
    }))
    .sort((a, b) => b.find.length - a.find.length)
  const config = {
    ...viteConfig,
    configFile: false,
    root: benchmarkRoot,
    mode: 'production',
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...aliases,
        ...Object.entries(viteConfig.resolve.alias).map(([find, replacement]) => ({
          find,
          replacement,
        })),
      ],
    },
    build: { ...viteConfig.build, outDir },
  }
  await build(config)
  return config
}

export const measureBenchmark = async (config, options, headed = false) => {
  const benchmark = validateBenchmark(options.benchmark ?? defaultBenchmark)
  const cpuSlowdown = options.cpuSlowdown ?? 20
  validateCpuSlowdown(cpuSlowdown)
  const server = await preview({
    ...config,
    preview: { ...config.preview, host: '127.0.0.1', port: 0 },
  })
  let browser
  try {
    browser = await chromium.launch({ headless: !headed })
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    })
    page.on('pageerror', (error) => console.error(error))
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown })
    const url = new URL(server.resolvedUrls.local[0])
    url.searchParams.set('benchmark', benchmark)
    if (config.mode === 'development') url.searchParams.set('profile', '')
    await page.goto(url.href)
    await page.waitForFunction(() => window.__BLITS_BENCH__?.ready === true)
    const crossOriginIsolated = await page.evaluate(() => window.crossOriginIsolated)
    const startedAt = new Date().toISOString()
    const started = performance.now()
    const results = await page.evaluate((options) => window.__BLITS_BENCH__.run(options), options)
    requireBenchmarkSupport(results, options.allowUnsupported)
    return {
      ...results,
      benchmark,
      cpuSlowdown,
      browserMode: headed ? 'headed' : 'headless',
      crossOriginIsolated,
      startedAt,
      durationMs: performance.now() - started,
      browserVersion: browser.version(),
      mode: config.mode,
    }
  } finally {
    try {
      await browser?.close()
    } finally {
      await server.close()
    }
  }
}

export const measureMemoryBenchmark = async (config, options, headed = true) => {
  const benchmark = validateBenchmark(options.benchmark ?? defaultBenchmark)
  const cpuSlowdown = options.cpuSlowdown ?? 20
  validateCpuSlowdown(cpuSlowdown)
  const size = options.size ?? DEFAULT_MEMORY_SIZE
  validateMemorySize(size)
  const { title } = await benchmarks[benchmark]()
  const server = await preview({
    ...config,
    preview: { ...config.preview, host: '127.0.0.1', port: 0 },
  })
  let browser
  try {
    browser = await chromium.launch({ headless: !headed })
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    })
    page.on('pageerror', (error) => console.error(error))
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown })
    await client.send('Performance.enable')
    const url = new URL(server.resolvedUrls.local[0])
    url.searchParams.set('benchmark', benchmark)
    await page.goto(url.href)
    await page.waitForFunction(() => window.__BLITS_BENCH__?.ready === true)
    const crossOriginIsolated = await page.evaluate(() => window.crossOriginIsolated)

    const heapUsedBytes = async () => {
      await client.send('HeapProfiler.collectGarbage')
      await client.send('HeapProfiler.collectGarbage')
      const { metrics } = await client.send('Performance.getMetrics')
      const metric = metrics.find((metric) => metric.name === 'JSHeapUsedSize')
      if (!metric) throw new Error('JSHeapUsedSize metric unavailable from CDP Performance domain')
      return metric.value
    }

    const startedAt = new Date().toISOString()
    const started = performance.now()

    const baselineBytes = await heapUsedBytes()
    await page.evaluate((size) => window.__BLITS_BENCH__.mount(size), size)
    const afterCreateBytes = await heapUsedBytes()
    await page.evaluate(() => window.__BLITS_BENCH__.unmount())
    const afterDestroyBytes = await heapUsedBytes()

    const summary = summarizeMemory(
      { title, benchmark, size },
      { baselineBytes, afterCreateBytes, afterDestroyBytes }
    )
    return {
      ...summary,
      cpuSlowdown,
      browserMode: headed ? 'headed' : 'headless',
      crossOriginIsolated,
      startedAt,
      durationMs: performance.now() - started,
      browserVersion: browser.version(),
      mode: config.mode,
    }
  } finally {
    try {
      await browser?.close()
    } finally {
      await server.close()
    }
  }
}

export const saveReport = async (report, output) => {
  if (!output) return
  const outputPath = resolve(benchmarkRoot, output)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  return outputPath
}

export const writeReport = async (report, output, summary, short = false) => {
  const json = `${JSON.stringify(report, null, 2)}\n`
  console.log(short ? formatShortSummary(report) : json)
  const outputPath = await saveReport(report, output)
  if (outputPath) console.log(`Results saved to ${outputPath}`)
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
  }
}

const run = async () => {
  const args = process.argv.slice(2)
  const profile = args.includes('--profile')
  const headed = args.includes('--headed')
  const short = args.includes('--short')
  const all = args.includes('--all')
  if (all && args.includes('--benchmark')) {
    throw new Error('Use either --all or --benchmark, not both')
  }
  const value = (name, fallback) => {
    const index = args.indexOf(name)
    if (index === -1) return fallback
    if (!args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error(`${name} requires a value`)
    }
    return args[index + 1]
  }
  const benchmark = validateBenchmark(value('--benchmark', defaultBenchmark))
  const sizeArg = value('--size', undefined)
  const options = {
    benchmark,
    cpuSlowdown: Number(value('--cpu-slowdown', 20)),
    size: Number(sizeArg ?? (isMemoryBenchmark(benchmark) ? DEFAULT_MEMORY_SIZE : 1000)),
    samples: Number(value('--samples', 20)),
    warmup: Number(value('--warmup', 5)),
  }
  if (isMemoryBenchmark(benchmark)) {
    validateMemorySize(options.size)
  } else {
    validateOptions(options)
  }
  validateCpuSlowdown(options.cpuSlowdown)
  const output = value('--output', undefined)
  if (args.includes('--output') && (!output || output.startsWith('--'))) {
    throw new Error('--output requires a file path')
  }
  const config = {
    root: benchmarkRoot,
    mode: profile ? 'development' : 'production',
  }
  await build(config)
  if (all) {
    const report = await runSuite(Object.keys(benchmarks), (name) => {
      const runOptions = {
        ...options,
        benchmark: name,
        size: sizeArg ?? (isMemoryBenchmark(name) ? DEFAULT_MEMORY_SIZE : options.size),
      }
      return isMemoryBenchmark(name)
        ? measureMemoryBenchmark(config, runOptions, headed)
        : measureBenchmark(config, runOptions, headed)
    })
    report.commit = process.env.GITHUB_SHA
    const summary = formatSuiteSummary(report)
    if (!short) console.log(summary)
    await writeReport(report, output, summary, short)
    if (report.status === 'failed') process.exitCode = 1
    return
  }
  const memory = isMemoryBenchmark(benchmark)
  const report = memory
    ? await measureMemoryBenchmark(config, options, headed)
    : await measureBenchmark(config, options, headed)
  report.commit = process.env.GITHUB_SHA
  if (memory) {
    // Default prints JSON; --short prints the formatted memory summary. No
    // GitHub step summary is written yet: the CI/workflow integration is a
    // separate follow-up once the CLI output is settled.
    console.log(short ? formatMemorySummary(report) : `${JSON.stringify(report, null, 2)}\n`)
    const outputPath = await saveReport(report, output)
    if (outputPath) console.log(`Results saved to ${outputPath}`)
  } else {
    await writeReport(report, output, formatSummary(report), short)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
