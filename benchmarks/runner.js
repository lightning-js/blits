import { fileURLToPath, pathToFileURL } from 'node:url'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { runSuite } from './suite.js'
import { validateOptions } from './src/benchmark-utils.js'
import { formatSummary, formatSuiteSummary } from './summary.js'
import { benchmarks, defaultBenchmark, validateBenchmark } from './benchmarks.js'
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
  const server = await preview({
    ...config,
    preview: { host: '127.0.0.1', port: 0 },
  })
  let browser
  try {
    browser = await chromium.launch({ headless: !headed })
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    })
    page.on('pageerror', (error) => console.error(error))
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 20 })
    const url = new URL(server.resolvedUrls.local[0])
    url.searchParams.set('benchmark', benchmark)
    if (config.mode === 'development') url.searchParams.set('profile', '')
    await page.goto(url.href)
    await page.waitForFunction(() => window.__BLITS_BENCH__?.ready === true)
    const results = await page.evaluate((options) => window.__BLITS_BENCH__.run(options), options)
    return {
      ...results,
      benchmark,
      cpuSlowdown: 20,
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

export const writeReport = async (report, output, summary) => {
  const json = `${JSON.stringify(report, null, 2)}\n`
  console.log(json)
  if (output) {
    const outputPath = resolve(benchmarkRoot, output)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, json)
    console.log(`Results saved to ${outputPath}`)
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
  }
}

const run = async () => {
  const args = process.argv.slice(2)
  const profile = args.includes('--profile')
  const headed = args.includes('--headed')
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
  const options = {
    benchmark: validateBenchmark(value('--benchmark', defaultBenchmark)),
    size: Number(value('--size', 1000)),
    samples: Number(value('--samples', 20)),
    warmup: Number(value('--warmup', 5)),
  }
  validateOptions(options)
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
    const report = await runSuite(Object.keys(benchmarks), (benchmark) =>
      measureBenchmark(config, { ...options, benchmark }, headed)
    )
    report.commit = process.env.GITHUB_SHA
    const summary = formatSuiteSummary(report)
    console.log(summary)
    await writeReport(report, output, summary)
    if (report.status === 'failed') process.exitCode = 1
    return
  }
  const report = await measureBenchmark(config, options, headed)
  report.commit = process.env.GITHUB_SHA
  await writeReport(report, output, formatSummary(report))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
