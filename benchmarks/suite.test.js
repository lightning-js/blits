import assert from 'node:assert/strict'
import test from 'node:test'
import { runSuite } from './suite.js'
import { formatSuiteSummary } from './summary.js'

test('runs benchmarks sequentially and retains complete results in registry order', async () => {
  const events = []
  const reports = {}
  const report = await runSuite(['first', 'second'], async (benchmark) => {
    events.push(`start ${benchmark}`)
    await new Promise((resolve) => setImmediate(resolve))
    events.push(`end ${benchmark}`)
    reports[benchmark] = { benchmark, results: [{ generationSyncMs: 1, totalToIdleMs: 2 }] }
    return reports[benchmark]
  })
  assert.deepEqual(events, ['start first', 'end first', 'start second', 'end second'])
  assert.equal(report.status, 'completed')
  assert.deepEqual(report.benchmarks, [reports.first, reports.second])
})

test('stops on failure and retains completed reports and the failing benchmark', async () => {
  const calls = []
  const report = await runSuite(['first', 'second', 'third'], async (benchmark) => {
    calls.push(benchmark)
    if (benchmark === 'second') throw new Error('Renderer timed out')
    return { benchmark, results: [] }
  })
  assert.deepEqual(calls, ['first', 'second'])
  assert.deepEqual(report, {
    status: 'failed',
    benchmarks: [
      { benchmark: 'first', results: [] },
      { benchmark: 'second', error: 'Renderer timed out' },
    ],
  })
})

test('suite summary exposes failures without formatting them as timings', () => {
  const summary = formatSuiteSummary({
    status: 'failed',
    benchmarks: [{ benchmark: 'second', error: 'Renderer timed out' }],
  })
  assert.match(summary, /Status: failed/)
  assert.match(summary, /\| second \| failed \| failed \|/)
  assert.match(summary, /Renderer timed out/)
})
