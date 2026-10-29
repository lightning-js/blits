import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzePairs, validateThreshold } from './statistics.js'
import { comparePairs } from './comparison.js'

const blocks = (effects, bias = 0) =>
  effects.flatMap((effect) =>
    [bias, -bias].map((orderBias, index) => ({
      order: index === 0 ? ['base', 'candidate'] : ['candidate', 'base'],
      base: { time: 100 },
      candidate: { time: 100 * Math.exp(effect + orderBias) },
    }))
  )
const analyze = (effects, bias = 0, threshold = 5) =>
  analyzePairs(blocks(effects, bias), 'time', threshold)

test('reciprocal pair changes cancel on a log scale and reverse comparisons are reciprocal', () => {
  const report = analyze([0, 0, 0, 0], Math.log(1.2))
  assert.ok(Math.abs(report.changePercent) < 1e-10)
  assert.equal(report.verdict, 'equivalent')
  const pairs = blocks([0.09, 0.1, 0.11, 0.1])
  const forward = analyzePairs(pairs, 'time')
  const reverse = analyzePairs(
    pairs.map((pair) => ({
      order: [...pair.order].reverse(),
      base: pair.candidate,
      candidate: pair.base,
    })),
    'time'
  )
  assert.equal(forward.verdict, 'regressed')
  assert.equal(reverse.verdict, 'improved')
  assert.ok(
    Math.abs((1 + forward.changePercent / 100) * (1 + reverse.changePercent / 100) - 1) < 1e-12
  )
})

test('interval agrees with a four-observation Student-t reference calculation', () => {
  const report = analyze([0.01, 0.02, 0.03, 0.04])
  const margin = 3.183 * Math.sqrt(0.0005 / 3 / 4)
  assert.ok(Math.abs(report.intervalPercent.lower - Math.expm1(0.025 - margin) * 100) < 1e-10)
  assert.ok(Math.abs(report.intervalPercent.upper - Math.expm1(0.025 + margin) * 100) < 1e-10)
  assert.equal(report.independentBlocks, 4)
  assert.equal(report.verdict, 'equivalent')
})

test('classifies known changes, equivalence, and uncertainty using the full interval', () => {
  const offsets = [-0.01, 0.01, -0.005, 0.005]
  assert.equal(analyze(offsets.map((x) => Math.log(1.1) + x)).verdict, 'regressed')
  assert.equal(analyze(offsets.map((x) => Math.log(0.9) + x)).verdict, 'improved')
  assert.equal(analyze(offsets).verdict, 'equivalent')
  assert.equal(analyze([-0.15, 0.15, -0.1, 0.1]).verdict, 'inconclusive')
  assert.equal(analyze(offsets.map((x) => Math.log(1.05) + x)).verdict, 'inconclusive')
  assert.equal(
    analyze(
      offsets.map((x) => Math.log(1.03) + x / 10),
      0,
      2
    ).verdict,
    'regressed'
  )
})

test('does not invent confidence from two pairs, inner samples, missing order, or odd budgets', () => {
  const pairs = blocks([0, 0, 0, 0])
  const tooFew = analyzePairs(
    pairs.slice(0, 2).map((pair) => ({ ...pair, samples: 100000 })),
    'time'
  )
  assert.equal(tooFew.intervalPercent, null)
  assert.equal(tooFew.verdict, 'inconclusive')
  assert.equal(tooFew.reason, 'insufficient-independent-blocks')
  assert.equal(analyzePairs(pairs.slice(0, 7), 'time').reason, 'incomplete-balanced-block')
  assert.equal(
    analyzePairs(
      pairs.map((pair) => ({ ...pair, order: 'invalid' })),
      'time'
    ).reason,
    'unbalanced-or-missing-order'
  )
  assert.equal(
    analyzePairs(
      pairs.map((pair) => ({ ...pair, order: ['base', 'candidate'] })),
      'time'
    ).reason,
    'unbalanced-or-missing-order'
  )
})

test('rejects invalid policies/timings and treats zero timings as non-estimable', () => {
  for (const value of [0, -1, 100, Infinity, NaN]) assert.throws(() => validateThreshold(value))
  assert.throws(() => comparePairs([]), /At least one/)
  for (const value of [-1, Infinity, NaN]) {
    assert.throws(
      () =>
        comparePairs([
          { base: { medianGenerationSyncMs: value }, candidate: { medianGenerationSyncMs: 10 } },
        ]),
      /Invalid benchmark timing/
    )
  }
  const pairs = blocks([0, 0, 0, 0])
  pairs[0].base.time = 0
  assert.equal(analyzePairs(pairs, 'time').verdict, 'inconclusive')
  assert.equal(analyzePairs(pairs, 'time').changePercent, null)
})

test('seeded iid log-normal model has reasonable coverage and detects 10% controls', () => {
  let state = 123456789
  const uniform = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return (state + 0.5) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform())
  let covered = 0,
    falseChanges = 0,
    detected = 0
  for (let trial = 0; trial < 2000; trial++) {
    const noise = Array.from({ length: 4 }, () => normal() * 0.02)
    const nullReport = analyze(noise, 0.03)
    if (nullReport.intervalPercent.lower <= 0 && nullReport.intervalPercent.upper >= 0) covered++
    if (['improved', 'regressed'].includes(nullReport.verdict)) falseChanges++
    if (
      analyze(
        noise.map((x) => x + Math.log(1.1)),
        0.03
      ).verdict === 'regressed'
    )
      detected++
  }
  // Model validation only: actual browser block independence/normality is not established.
  assert.ok(covered > 1850 && covered < 1950, `coverage: ${covered}/2000`)
  assert.ok(falseChanges < 20, `false changes: ${falseChanges}/2000`)
  assert.ok(detected > 1500, `detected 10% controls: ${detected}/2000`)
})
