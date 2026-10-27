export const checkBenchmarkSupport = async (title, checkSupport) => {
  const reason = await checkSupport?.()
  if (reason === undefined) return
  if (typeof reason !== 'string' || !reason.trim()) {
    throw new Error('checkSupport must return undefined or a non-empty reason string')
  }
  return { title, status: 'unsupported', reason }
}

export const requireBenchmarkSupport = (result, allowUnsupported = false) => {
  if (result.status === 'unsupported' && !allowUnsupported) {
    throw new Error(`Benchmark unsupported: ${result.reason}`)
  }
}
