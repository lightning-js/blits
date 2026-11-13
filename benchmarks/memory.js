import {
  analyzePairs,
  validateThreshold,
  DEFAULT_THRESHOLD_PERCENT,
  verdictLabel,
  formatInterval,
} from './statistics.js'

export const DEFAULT_MEMORY_SIZE = 10000

// Metrics compared across base/candidate memory runs: heap grown while the
// components are mounted, and heap still retained above baseline after they're
// destroyed and the renderer settles (a proxy for leaks).
export const MEMORY_METRICS = ['createdMb', 'retainedMb']

export const validateMemorySize = (size) => {
  if (!Number.isSafeInteger(size) || size < 1) {
    throw new Error('size must be a positive integer')
  }
}

const bytesToMb = (bytes) => bytes / (1024 * 1024)

// Builds the three memory states (baseline / after create / after destroy)
// and their deltas from raw JS heap byte readings taken via CDP.
export const summarizeMemory = (
  { title, benchmark, size },
  { baselineBytes, afterCreateBytes, afterDestroyBytes }
) => {
  const createdBytes = afterCreateBytes - baselineBytes
  const retainedBytes = afterDestroyBytes - baselineBytes
  const freedBytes = afterCreateBytes - afterDestroyBytes
  const freedPercent = createdBytes > 0 ? (freedBytes / createdBytes) * 100 : null
  return {
    kind: 'memory',
    title,
    benchmark,
    size,
    freedPercent,
    baselineMb: bytesToMb(baselineBytes),
    afterCreateMb: bytesToMb(afterCreateBytes),
    afterDestroyMb: bytesToMb(afterDestroyBytes),
    createdMb: bytesToMb(createdBytes),
    retainedMb: bytesToMb(retainedBytes),
    freedMb: bytesToMb(freedBytes),
  }
}

export const formatMemorySummary = (report) => {
  const mb = (value) => value.toFixed(2)
  return [
    `## ${report.title}`,
    '',
    '| Configuration | Value |',
    '| --- | --- |',
    `| Size | ${report.size} |`,
    `| CPU slowdown | ${report.cpuSlowdown}× |`,
    `| Chromium | ${report.browserVersion} |`,
    `| Mode | ${report.mode} |`,
    '',
    '| State | Heap used (MB) | Delta from baseline (MB) |',
    '| --- | ---: | ---: |',
    `| Baseline (empty page) | ${mb(report.baselineMb)} | — |`,
    `| After creating ${report.size} components | ${mb(report.afterCreateMb)} | +${mb(report.createdMb)} |`,
    `| After destroying ${report.size} components | ${mb(report.afterDestroyMb)} | ${report.retainedMb >= 0 ? '+' : ''}${mb(report.retainedMb)} |`,
    '',
    `Freed ${mb(report.freedMb)} MB of the ${mb(report.createdMb)} MB created (${report.freedPercent === null ? 'N/A' : `${mb(report.freedPercent)}%`}). A positive "delta from baseline" after destroy may indicate retained memory.`,
    '',
    'Readings are taken after forcing garbage collection (CDP HeapProfiler.collectGarbage) and waiting for the renderer to reach idle.',
    '',
  ].join('\n')
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : sorted[middle - 1] + (sorted[middle] - sorted[middle - 1]) / 2
}

// Memory benchmarks run once per launch (no warmup/samples), so each pair holds
// a single base and candidate reading. Comparison is over MB deltas.
export const compareMemoryPairs = (
  pairs,
  { thresholdPercent = DEFAULT_THRESHOLD_PERCENT, metrics = MEMORY_METRICS } = {}
) => {
  validateThreshold(thresholdPercent)
  if (!Array.isArray(pairs) || !pairs.length)
    throw new Error('At least one benchmark pair is required')
  return metrics.map((metric) => {
    for (const pair of pairs) {
      for (const side of ['base', 'candidate']) {
        if (!Number.isFinite(pair[side]?.[metric])) {
          throw new Error('Invalid memory reading')
        }
      }
    }
    const differences = pairs.map(({ base, candidate }) => candidate[metric] - base[metric])
    return {
      metric,
      baseMb: median(pairs.map((pair) => pair.base[metric])),
      candidateMb: median(pairs.map((pair) => pair.candidate[metric])),
      differenceMb: median(differences),
      ...analyzePairs(pairs, metric, thresholdPercent),
    }
  })
}

const formatMemoryComparisonSection = (report) => {
  const mb = (value) => (value === null ? 'N/A' : value.toFixed(2))
  const labels = { createdMb: 'Created (mount)', retainedMb: 'Retained (after destroy)' }
  return [
    `## ${report.title}: memory comparison`,
    '',
    '| Configuration | Value |',
    '| --- | --- |',
    `| Base commit | ${report.base.commit} |`,
    `| Candidate commit | ${report.candidate.commit} |`,
    `| Candidate working tree changes | ${report.candidate.dirty} |`,
    `| Size | ${report.size} |`,
    `| Pairs | ${report.pairs.length} |`,
    `| Practical equivalence band | ±${report.thresholdPercent ?? DEFAULT_THRESHOLD_PERCENT}% |`,
    `| CPU slowdown | ${report.cpuSlowdown}× |`,
    `| Chromium | ${report.browserVersion} |`,
    '',
    '| Median heap delta | Base (MB) | Candidate (MB) | Median paired difference (MB) | Estimated change | 95% interval | Result |',
    '| --- | ---: | ---: | ---: | ---: | --- | --- |',
    ...report.comparison.map(
      (row) =>
        `| ${labels[row.metric]} | ${mb(row.baseMb)} | ${mb(row.candidateMb)} | ${mb(row.differenceMb)} | ${row.changePercent === null ? 'N/A' : `${row.changePercent.toFixed(2)}%`} | ${formatInterval(row)} | ${verdictLabel(row)} |`
    ),
    '',
  ].join('\n')
}

export const formatMemoryComparison = (report) => formatMemoryComparisonSection(report)

export const formatMemoryComparisonOverview = (reports) => {
  const change = (report, metric) => {
    const row = report.comparison.find((row) => row.metric === metric)
    const value = row.changePercent
    return `${value === null ? 'N/A' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`}${row.intervalPercent ? ` · ${formatInterval(row)}` : ''} · ${verdictLabel(row)}`
  }
  return [
    '| Benchmark | Created change | Retained change |',
    '| --- | ---: | ---: |',
    ...reports.map(
      (report) =>
        `| ${report.title} | ${change(report, 'createdMb')} | ${change(report, 'retainedMb')} |`
    ),
  ].join('\n')
}
