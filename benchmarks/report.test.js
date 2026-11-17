import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeReport } from './runner.js'
import { formatShortSummary } from './summary.js'
import { validateCpuSlowdown } from './src/benchmark-utils.js'
import { comparePairs } from './comparison.js'

const result = {
  benchmark: 'test',
  title: 'Test',
  size: 1000,
  warmup: 20,
  samples: 1,
  medianGenerationSyncMs: 10,
  medianTotalToIdleMs: 20,
  results: [{ generationSyncMs: 10, totalToIdleMs: 20 }],
}

test('short output omits raw samples while preserving JSON and workflow summary files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'blits-report-test-'))
  const output = join(directory, 'report.json')
  const summary = join(directory, 'summary.md')
  const previousSummary = process.env.GITHUB_STEP_SUMMARY
  const previousLog = console.log
  const logs = []
  try {
    process.env.GITHUB_STEP_SUMMARY = summary
    console.log = (value) => logs.push(value)
    await writeReport(result, output, 'Complete workflow summary', true)
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), result)
    assert.equal(await readFile(summary, 'utf8'), 'Complete workflow summary')
    assert.match(logs[0], /warmup 20/)
    assert.match(logs[0], /10\.00 \| 20\.00/)
    assert.doesNotMatch(logs[0], /"results"|generationSyncMs/)
    logs.length = 0
    await writeReport(result, undefined, '')
    assert.deepEqual(JSON.parse(logs[0]), result)
  } finally {
    console.log = previousLog
    if (previousSummary === undefined) delete process.env.GITHUB_STEP_SUMMARY
    else process.env.GITHUB_STEP_SUMMARY = previousSummary
    await rm(directory, { recursive: true, force: true })
  }
})

test('short comparison output includes all workloads and unsupported reasons', () => {
  const pairs = [
    {
      base: { status: 'unsupported', reason: 'Requires feature X' },
      candidate: result,
    },
  ]
  const report = { ...result, pairs, comparison: comparePairs(pairs) }
  const summary = formatShortSummary({ benchmarks: [report, { ...report, title: 'Second' }] })
  assert.match(summary, /pairs 1/)
  assert.match(summary, /Test \| N\/A \| N\/A/)
  assert.match(summary, /Second \| N\/A \| N\/A/)
  assert.match(summary, /Requires feature X/)
})

test('short suite output retains failures', () => {
  const summary = formatShortSummary({
    status: 'failed',
    benchmarks: [result, { benchmark: 'broken', error: 'Timed out' }],
  })
  assert.match(summary, /Status: failed/)
  assert.match(summary, /broken: failed — Timed out/)
  assert.match(summary, /test \| 10\.00 \| 20\.00/)
})

test('short comparisons show CPU rate, absolute medians, and individual pair changes', () => {
  const pairs = [
    { base: result, candidate: { ...result, medianGenerationSyncMs: 12 } },
    { base: result, candidate: { ...result, medianGenerationSyncMs: 9 } },
  ]
  const summary = formatShortSummary({
    ...result,
    cpuSlowdown: 4,
    pairs,
    comparison: comparePairs(pairs),
  })
  assert.match(summary, /CPU 4×/)
  assert.match(summary, /Synchronous work \| 10\.00 \| 10\.50 \| P1: \+20\.00%, P2: -10\.00%/)
})

test('CPU slowdown accepts finite rates at least one', () => {
  for (const rate of [1, 4, 20, 1.5]) assert.doesNotThrow(() => validateCpuSlowdown(rate))
  for (const rate of [0, -1, 0.5, Infinity, NaN])
    assert.throws(() => validateCpuSlowdown(rate), /CPU slowdown/)
})
