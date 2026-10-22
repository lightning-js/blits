import { fileURLToPath, pathToFileURL } from 'node:url'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { formatSummary } from './summary.js'
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
    const url = server.resolvedUrls.local[0]
    await page.goto(config.mode === 'development' ? `${url}?profile` : url)
    await page.waitForFunction(() => window.__BLITS_BENCH__?.ready === true)
    const results = await page.evaluate((options) => window.__BLITS_BENCH__.run(options), options)
    return {
      ...results,
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
  const value = (name, fallback) => {
    const index = args.indexOf(name)
    return index === -1 ? fallback : args[index + 1]
  }
  const options = {
    size: Number(value('--size', 1000)),
    samples: Number(value('--samples', 20)),
    warmup: Number(value('--warmup', 5)),
  }
  const output = value('--output', undefined)
  if (args.includes('--output') && (!output || output.startsWith('--'))) {
    throw new Error('--output requires a file path')
  }
  const config = {
    root: benchmarkRoot,
    mode: profile ? 'development' : 'production',
  }
  await build(config)
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
