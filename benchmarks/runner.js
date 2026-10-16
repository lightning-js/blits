import { fileURLToPath } from 'node:url'
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { formatSummary } from './summary.js'

const benchmarkRoot = fileURLToPath(new URL('.', import.meta.url))
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

const run = async () => {
  const config = {
    root: benchmarkRoot,
    mode: profile ? 'development' : 'production',
  }
  await build(config)
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
    await page.goto(profile ? `${url}?profile` : url)
    await page.waitForFunction(() => window.__BLITS_BENCH__?.ready === true)
    const results = await page.evaluate((options) => window.__BLITS_BENCH__.run(options), options)
    const report = {
      ...results,
      cpuSlowdown: 20,
      browserVersion: browser.version(),
      mode: config.mode,
      commit: process.env.GITHUB_SHA,
    }
    const json = `${JSON.stringify(report, null, 2)}\n`
    console.log(json)
    if (output) {
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, json)
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, formatSummary(report))
    }
  } finally {
    try {
      await browser?.close()
    } finally {
      await server.close()
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
