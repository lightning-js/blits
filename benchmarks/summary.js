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
