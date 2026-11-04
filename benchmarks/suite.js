export const runSuite = async (names, measure) => {
  const report = { status: 'completed', benchmarks: [] }
  for (const benchmark of names) {
    console.log(`Running ${benchmark}…`)
    try {
      report.benchmarks.push(await measure(benchmark))
    } catch (error) {
      report.status = 'failed'
      report.benchmarks.push({ benchmark, error: error.message })
      break
    }
  }
  return report
}
