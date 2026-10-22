const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export const comparePairs = (pairs) => {
  return ['medianGenerationSyncMs', 'medianTotalToIdleMs'].map((metric) => {
    const differences = pairs.map(({ base, candidate }) => candidate[metric] - base[metric])
    const percentages = pairs.map(({ base }, index) =>
      base[metric] === 0 ? null : (differences[index] / base[metric]) * 100
    )
    return {
      metric,
      baseMs: median(pairs.map((pair) => pair.base[metric])),
      candidateMs: median(pairs.map((pair) => pair.candidate[metric])),
      differenceMs: median(differences),
      changePercent: percentages.includes(null) ? null : median(percentages),
      pairChangesPercent: percentages,
    }
  })
}

export const formatComparison = (report) => {
  const number = (value) => (value === null ? 'n/a' : value.toFixed(2))
  const labels = {
    medianGenerationSyncMs: 'Synchronous generation',
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
    `| CPU slowdown | ${report.cpuSlowdown}× |`,
    `| Chromium | ${report.browserVersion} |`,
    '| Mode | production |',
    '',
    '| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...report.comparison.map(
      (row) =>
        `| ${labels[row.metric]} | ${number(row.baseMs)} | ${number(row.candidateMs)} | ${number(row.differenceMs)} | ${number(row.changePercent)} |`
    ),
    '',
    '| Pair | Order | Generation change (%) | Time to idle change (%) |',
    '| --- | --- | ---: | ---: |',
    ...report.pairs.map(
      (pair, index) =>
        `| ${index + 1} | ${pair.order.join(' → ')} | ${report.comparison.map((row) => number(row.pairChangesPercent[index])).join(' | ')} |`
    ),
    '',
    'Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.',
    '',
    'Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.',
    '',
  ].join('\n')
}
