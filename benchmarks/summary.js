import { MIN_BLOCKS, DEFAULT_THRESHOLD_PERCENT } from './statistics.js'
import { formatComparisonOverview, unsupportedReasons } from './comparison.js'

export const formatSummary = (report) => {
  const timingRow = (label, metric) => {
    const values = ['median', 'average', 'min', 'max'].map((stat) =>
      report[`${stat}${metric}`].toFixed(2)
    )
    return `| ${label} | ${values.join(' | ')} |`
  }
  return [
    `## ${report.title}`,
    '',
    '| Configuration | Value |',
    '| --- | --- |',
    `| Size | ${report.size} |`,
    `| Warmup | ${report.warmup} |`,
    `| Samples | ${report.samples} |`,
    `| CPU slowdown | ${report.cpuSlowdown}× |`,
    `| Chromium | ${report.browserVersion} |`,
    `| Mode | ${report.mode} |`,
    '',
    '| Timing (ms) | Median | Average | Min | Max |',
    '| --- | ---: | ---: | ---: | ---: |',
    timingRow('Synchronous generation', 'GenerationSyncMs'),
    timingRow('Total time to idle', 'TotalToIdleMs'),
    '',
    'Warmups are excluded. Total time to idle includes synchronous generation and frame scheduling.',
    '',
  ].join('\n')
}

export const formatSuiteSummary = (report) =>
  [
    '# Benchmark suite',
    '',
    `Status: ${report.status}`,
    '',
    '| Benchmark | Median generation (ms) | Median time to idle (ms) |',
    '| --- | ---: | ---: |',
    ...report.benchmarks.map((result) =>
      result.error
        ? `| ${result.benchmark} | failed | failed |`
        : `| ${result.benchmark} | ${result.medianGenerationSyncMs.toFixed(2)} | ${result.medianTotalToIdleMs.toFixed(2)} |`
    ),
    '',
    ...report.benchmarks.map((result) =>
      result.error ? `## ${result.benchmark}: failed\n\n${result.error}\n` : formatSummary(result)
    ),
  ].join('\n')

export const formatShortSummary = (report) => {
  const reports = report.benchmarks ?? [report]
  const comparison = reports.some((result) => result.comparison)
  return [
    ...(report.status ? [`Status: ${report.status}`, ''] : []),
    ...reports.map((result) =>
      result.error
        ? `${result.benchmark}: failed — ${result.error}`
        : `${result.title}: size ${result.size}, warmup ${result.warmup}, samples ${result.samples}, CPU ${result.cpuSlowdown ?? 20}×${result.pairs ? `, pairs ${result.pairs.length}, blocks ${result.comparison?.[0]?.independentBlocks ?? 0}, practical band ±${result.thresholdPercent ?? DEFAULT_THRESHOLD_PERCENT}%` : ''}`
    ),
    '',
    ...(comparison
      ? [
          `95% intervals require at least ${MIN_BLOCKS} balanced blocks (${MIN_BLOCKS * 2} pairs). Shorter runs are preliminary; percentage estimates alone are not evidence of a change.`,
          '',
        ]
      : []),
    ...(comparison
      ? [
          formatComparisonOverview(reports),
          '',
          '| Benchmark | Metric | Base (ms) | Candidate (ms) | Pair changes (%) |',
          '| --- | --- | ---: | ---: | --- |',
          ...reports.flatMap((result) =>
            result.comparison.map(
              (row) =>
                `| ${result.title} | ${row.metric === 'medianGenerationSyncMs' ? 'Generation' : 'Time to idle'} | ${row.baseMs === null ? 'N/A' : row.baseMs.toFixed(2)} | ${row.candidateMs.toFixed(2)} | ${row.pairChangesPercent.map((value, index) => `P${index + 1}: ${value === null ? 'N/A' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`}`).join(', ')} |`
            )
          ),
          '',
          'Pair order alternates: P1 base → candidate, P2 candidate → base, and so on.',
          ...reports.flatMap((result) =>
            unsupportedReasons(result).map((reason) => `${result.title}: N/A — ${reason}`)
          ),
        ]
      : [
          '| Benchmark | Median generation (ms) | Median time to idle (ms) |',
          '| --- | ---: | ---: |',
          ...reports
            .filter((result) => !result.error)
            .map(
              (result) =>
                `| ${result.benchmark ?? result.title} | ${result.medianGenerationSyncMs.toFixed(2)} | ${result.medianTotalToIdleMs.toFixed(2)} |`
            ),
        ]),
  ].join('\n')
}
