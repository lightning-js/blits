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
