export const DEFAULT_MEMORY_SIZE = 10000

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
