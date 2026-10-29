export const CONFIDENCE_LEVEL = 0.95
export const MIN_BLOCKS = 4
export const DEFAULT_THRESHOLD_PERCENT = 5

export const validateThreshold = (value) => {
  if (!Number.isFinite(value) || value <= 0 || value >= 100) {
    throw new Error('Threshold must be a finite percentage greater than 0 and less than 100')
  }
  return value
}

// Two-sided 95% Student-t critical values, rounded upward from the NIST table.
// https://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm
// Cap df at 30: using its larger critical value is conservative for larger samples.
const criticalValues = [
  NaN,
  12.707,
  4.303,
  3.183,
  2.777,
  2.572,
  2.448,
  2.366,
  2.307,
  2.263,
  2.229,
  2.202,
  2.18,
  2.161,
  2.146,
  2.132,
  2.121,
  2.111,
  2.102,
  2.094,
  2.087,
  2.081,
  2.075,
  2.07,
  2.065,
  2.061,
  2.057,
  2.053,
  2.049,
  2.046,
  2.043,
]

export const analyzePairs = (pairs, metric, thresholdPercent = DEFAULT_THRESHOLD_PERCENT) => {
  validateThreshold(thresholdPercent)
  const logs = pairs.map(({ base, candidate }) =>
    base[metric] > 0 && candidate[metric] > 0
      ? Math.log(candidate[metric]) - Math.log(base[metric])
      : null
  )
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
  const changePercent = logs.includes(null) ? null : Math.expm1(mean(logs)) * 100
  const result = {
    method: 'balanced-log-ratio-t95',
    changePercent: Number.isFinite(changePercent) ? changePercent : null,
    intervalPercent: null,
    confidenceLevel: CONFIDENCE_LEVEL,
    thresholdPercent,
    independentBlocks: Math.floor(pairs.length / 2),
    verdict: 'inconclusive',
    reason: null,
  }
  if (result.changePercent === null)
    return { ...result, reason: 'non-positive-or-unrepresentable-timing' }
  if (pairs.length % 2 !== 0) return { ...result, reason: 'incomplete-balanced-block' }
  const blocks = []
  for (let index = 0; index < pairs.length; index += 2) {
    const order = (pair) => (Array.isArray(pair.order) ? pair.order.join(',') : '')
    const first = order(pairs[index])
    const second = order(pairs[index + 1])
    if (!(
      (first === 'base,candidate' && second === 'candidate,base') ||
      (first === 'candidate,base' && second === 'base,candidate')
    )) {
      return { ...result, reason: 'unbalanced-or-missing-order' }
    }
    blocks.push((logs[index] + logs[index + 1]) / 2)
  }
  if (blocks.length < MIN_BLOCKS) return { ...result, reason: 'insufficient-independent-blocks' }
  const center = mean(blocks)
  const variance =
    blocks.reduce((sum, value) => sum + (value - center) ** 2, 0) / (blocks.length - 1)
  const margin =
    criticalValues[Math.min(blocks.length - 1, 30)] * Math.sqrt(variance / blocks.length)
  const lower = Math.expm1(center - margin) * 100
  const upper = Math.expm1(center + margin) * 100
  if (!Number.isFinite(lower) || !Number.isFinite(upper))
    return { ...result, reason: 'unrepresentable-interval' }
  const verdict =
    upper < -thresholdPercent
      ? 'improved'
      : lower > thresholdPercent
        ? 'regressed'
        : lower > -thresholdPercent && upper < thresholdPercent
          ? 'equivalent'
          : 'inconclusive'
  return {
    ...result,
    intervalPercent: { lower, upper },
    verdict,
    reason: verdict === 'inconclusive' ? 'interval-crosses-practical-boundary' : null,
  }
}

export const verdictLabel = (row) => {
  if (
    row.independentBlocks < MIN_BLOCKS &&
    ['insufficient-independent-blocks', 'incomplete-balanced-block'].includes(row.reason)
  )
    return 'Preliminary'
  return (
    {
      improved: 'Improvement',
      regressed: 'Regression',
      equivalent: 'No meaningful change',
      inconclusive: 'Inconclusive',
      unsupported: 'N/A',
    }[row.verdict] ?? 'Inconclusive'
  )
}

export const formatInterval = (row) =>
  row.intervalPercent
    ? `[${row.intervalPercent.lower.toFixed(2)}%, ${row.intervalPercent.upper.toFixed(2)}%]`
    : 'unavailable'
