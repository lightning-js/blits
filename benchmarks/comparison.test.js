import assert from 'node:assert/strict'
import test from 'node:test'
import { comparePairs, formatComparison, formatComparisonOverview } from './comparison.js'

const timings = (value) => ({
  medianGenerationSyncMs: value,
  medianTotalToIdleMs: value * 2,
})

test('compares paired multiplicative effects rather than averaging percentages', () => {
  const rows = comparePairs([
    { order: ['base', 'candidate'], base: timings(10), candidate: timings(20) },
    { order: ['candidate', 'base'], base: timings(100), candidate: timings(90) },
  ])
  assert.equal(rows[0].baseMs, 55)
  assert.equal(rows[0].candidateMs, 55)
  assert.equal(rows[0].differenceMs, 0)
  assert.ok(Math.abs(rows[0].changePercent - (Math.sqrt(1.8) - 1) * 100) < 1e-10)
  assert.deepEqual(rows[0].pairChangesPercent, [100, -10])
  assert.equal(rows[0].verdict, 'inconclusive')
  assert.equal(rows[0].reason, 'insufficient-independent-blocks')
})

test('identical timings produce no change and zero baselines have no percentage', () => {
  assert.equal(comparePairs([{ base: timings(10), candidate: timings(10) }])[0].changePercent, 0)
  const [row] = comparePairs([{ base: timings(0), candidate: timings(10) }])
  assert.equal(row.differenceMs, 10)
  assert.equal(row.changePercent, null)
})

test('short comparisons show preliminary estimates without claiming a performance change', () => {
  const pairs = [
    { order: ['base', 'candidate'], base: timings(10), candidate: timings(12) },
    { order: ['candidate', 'base'], base: timings(10), candidate: timings(12) },
  ]
  const overview = formatComparisonOverview([{ title: 'Test', comparison: comparePairs(pairs) }])
  assert.match(overview, /\+20\.00% · Preliminary/)
  assert.doesNotMatch(overview, /Improvement|Regression|No meaningful change|unavailable/)
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

test('unsupported baselines have N/A comparisons and retain candidate timings and the reason', () => {
  const pairs = [
    {
      order: ['base', 'candidate'],
      base: { status: 'unsupported', reason: 'Requires the new API' },
      candidate: timings(20),
    },
  ]
  const comparison = comparePairs(pairs)
  assert.equal(comparison[0].baseMs, null)
  assert.equal(comparison[0].candidateMs, 20)
  assert.equal(comparison[0].changePercent, null)
  assert.equal(comparison[0].verdict, 'unsupported')
  assert.equal(comparison[0].intervalPercent, null)
  assert.deepEqual(comparison[0].pairChangesPercent, [null])
  const report = {
    title: 'New feature',
    pairs,
    comparison,
    base: { commit: 'base' },
    candidate: { commit: 'candidate' },
    size: 1000,
    warmup: 5,
    samples: 20,
    cpuSlowdown: 20,
    browserVersion: 'test',
  }
  assert.match(formatComparison(report), /N\/A — unsupported by baseline: Requires the new API/)
  assert.match(formatComparison(report), /N\/A \| 20\.00 \| N\/A \| N\/A/)
  assert.match(formatComparisonOverview([report]), /New feature \| N\/A \| N\/A/)
})
