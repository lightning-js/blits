import {
  analyzePairs,
  validateThreshold,
  DEFAULT_THRESHOLD_PERCENT,
  MIN_BLOCKS,
  verdictLabel,
  formatInterval,
} from './statistics.js'

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : sorted[middle - 1] + (sorted[middle] - sorted[middle - 1]) / 2
}

export const comparePairs = (pairs, { thresholdPercent = DEFAULT_THRESHOLD_PERCENT } = {}) => {
  validateThreshold(thresholdPercent)
  if (!Array.isArray(pairs) || !pairs.length)
    throw new Error('At least one benchmark pair is required')
  return ['medianGenerationSyncMs', 'medianTotalToIdleMs'].map((metric) => {
    for (const pair of pairs) {
      for (const side of ['base', 'candidate']) {
        if (side === 'base' && pair.base?.status === 'unsupported') continue
        if (!Number.isFinite(pair[side]?.[metric]) || pair[side][metric] < 0) {
          throw new Error('Invalid benchmark timing')
        }
      }
    }
    const unsupported = pairs.some((pair) => pair.base.status === 'unsupported')
    if (unsupported) {
      return {
        metric,
        baseMs: null,
        candidateMs: median(pairs.map((pair) => pair.candidate[metric])),
        differenceMs: null,
        changePercent: null,
        pairChangesPercent: pairs.map(() => null),
        ...analyzePairs(pairs, metric, thresholdPercent),
        verdict: 'unsupported',
        reason: 'unsupported-baseline',
      }
    }
    const differences = pairs.map(({ base, candidate }) => candidate[metric] - base[metric])
    const percentages = pairs.map(({ base }, index) => {
      const percent = base[metric] === 0 ? NaN : (differences[index] / base[metric]) * 100
      return Number.isFinite(percent) ? percent : null
    })
    return {
      metric,
      baseMs: median(pairs.map((pair) => pair.base[metric])),
      candidateMs: median(pairs.map((pair) => pair.candidate[metric])),
      differenceMs: median(differences),
      pairChangesPercent: percentages,
      ...analyzePairs(pairs, metric, thresholdPercent),
    }
  })
}

const formatComparisonSection = (report) => {
  const number = (value) => (value === null ? 'N/A' : value.toFixed(2))
  const labels = {
    medianGenerationSyncMs: 'Synchronous work',
    medianTotalToIdleMs: 'Total time to idle',
  }
  return [
    `## ${report.title}: comparison`,
    '',
    '| Configuration | Value |',
    '| --- | --- |',
    `| Base commit | ${report.base.commit} |`,
    `| Candidate commit | ${report.candidate.commit} |`,
    `| Candidate working tree changes | ${report.candidate.dirty} |`,
    `| Size / warmup / samples per run | ${report.size} / ${report.warmup} / ${report.samples} |`,
    `| Pairs | ${report.pairs.length} |`,
    `| Practical equivalence band | ±${report.thresholdPercent ?? DEFAULT_THRESHOLD_PERCENT}% |`,
    `| Balanced blocks | ${report.comparison[0].independentBlocks}; minimum ${MIN_BLOCKS} |`,
    `| CPU slowdown | ${report.cpuSlowdown}× |`,
    `| Chromium | ${report.browserVersion} |`,
    '| Mode | production |',
    '',
    ...unsupportedReasons(report).map((reason) => `N/A — unsupported by baseline: ${reason}`),
    '',
    '| Median timing | Base (ms) | Candidate (ms) | Median paired difference (ms) | Estimated change | 95% interval | Result |',
    '| --- | ---: | ---: | ---: | ---: | --- | --- |',
    ...report.comparison.map(
      (row) =>
        `| ${labels[row.metric]} | ${number(row.baseMs)} | ${number(row.candidateMs)} | ${number(row.differenceMs)} | ${row.changePercent === null ? 'N/A' : `${number(row.changePercent)}%`} | ${formatInterval(row)} | ${verdictLabel(row)} |`
    ),
    '',
    '| Pair | Order | Synchronous work change (%) | Time to idle change (%) |',
    '| --- | --- | ---: | ---: |',
    ...report.pairs.map(
      (pair, index) =>
        `| ${index + 1} | ${pair.order.join(' → ')} | ${report.comparison.map((row) => number(row.pairChangesPercent[index])).join(' | ')} |`
    ),
    '',
  ].join('\n')
}

const comparisonNotes = [
  'Negative changes mean faster. Estimated change is the geometric mean of paired candidate/base ratios. Absolute columns are medians of run medians; the paired absolute difference is descriptive and need not equal the percentage estimate.',
  '',
  `95% Student-t intervals use mean log ratios in balanced four-launch blocks (AB/BA), not inner samples. Fewer than ${MIN_BLOCKS} blocks (${MIN_BLOCKS * 2} pairs) are preliminary. With sufficient data, verdicts compare the full interval with the practical band; inconclusive does not mean unchanged. Intervals assume independent, approximately normal block means and do not correct systematic bias, drift, or multiple-metric testing. With only two blocks, the variance estimate is particularly uncertain. Choose the run budget before measuring.`,
  '',
  'Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous work and frame scheduling, not GPU completion. Results are informational; verdicts do not fail CI.',
  '',
].join('\n')

export const formatComparison = (report) => `${formatComparisonSection(report)}\n${comparisonNotes}`

export const formatComparisonOverview = (reports) => {
  const change = (report, metric) => {
    const row = report.comparison.find((row) => row.metric === metric)
    const value = row.changePercent
    if (row.verdict === 'unsupported') return 'N/A'
    return `${value === null ? 'N/A' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`}${row.intervalPercent ? ` · ${formatInterval(row)}` : ''} · ${verdictLabel(row)}`
  }
  return [
    '| Benchmark | Synchronous work change | Time to idle change |',
    '| --- | ---: | ---: |',
    ...reports.map(
      (report) =>
        `| ${report.title} | ${change(report, 'medianGenerationSyncMs')} | ${change(report, 'medianTotalToIdleMs')} |`
    ),
  ].join('\n')
}

export const formatComparisonSuite = (report) =>
  [
    '# Benchmark suite comparison',
    '',
    formatComparisonOverview(report.benchmarks),
    '',
    ...report.benchmarks.map(formatComparisonSection),
    comparisonNotes,
  ].join('\n')

export const unsupportedReasons = (report) => [
  ...new Set(
    report.pairs
      .filter((pair) => pair.base.status === 'unsupported')
      .map((pair) => pair.base.reason)
  ),
]
