import assert from 'node:assert/strict'
import test from 'node:test'
import { comparePairs, formatComparison } from './comparison.js'

const timings = (value) => ({
  medianGenerationSyncMs: value,
  medianTotalToIdleMs: value * 2,
})

test('compares within pairs before aggregating percentages', () => {
  const rows = comparePairs([
    { base: timings(10), candidate: timings(20) },
    { base: timings(100), candidate: timings(90) },
  ])
  assert.deepEqual(rows[0], {
    metric: 'medianGenerationSyncMs',
    baseMs: 55,
    candidateMs: 55,
    differenceMs: 0,
    changePercent: 45,
    pairChangesPercent: [100, -10],
  })
  assert.equal(rows[1].changePercent, 45)
})

test('identical timings produce no change and zero baselines have no percentage', () => {
  assert.equal(comparePairs([{ base: timings(10), candidate: timings(10) }])[0].changePercent, 0)
  const [row] = comparePairs([{ base: timings(0), candidate: timings(10) }])
  assert.equal(row.differenceMs, 10)
  assert.equal(row.changePercent, null)
})

test('summary exposes run order and faster changes with a negative percentage', () => {
  const pairs = [
    {
      base: timings(100),
      candidate: timings(80),
      order: ['candidate', 'base'],
    },
  ]
  const summary = formatComparison({
    title: 'Example',
    base: { commit: 'base-sha' },
    candidate: { commit: 'candidate-sha', dirty: true },
    size: 1000,
    warmup: 5,
    samples: 20,
    cpuSlowdown: 20,
    browserVersion: 'test',
    pairs,
    comparison: comparePairs(pairs),
  })
  assert.match(summary, /candidate → base/)
  assert.match(summary, /100\.00 \| 80\.00 \| -20\.00 \| -20\.00/)
  assert.match(summary, /Candidate working tree changes \| true/)
})
