export const benchmarks = {
  'element-creation': () => import('./src/benchmarks/ElementCreation.js'),
  'component-creation': () => import('./src/benchmarks/ComponentCreation.js'),
  'computed-loop-creation': () => import('./src/benchmarks/ComputedLoopCreation.js'),
  'computed-binding-updates': () => import('./src/benchmarks/ComputedBindingUpdates.js'),
}

export const defaultBenchmark = 'element-creation'

export const validateBenchmark = (name) => {
  if (!Object.hasOwn(benchmarks, name)) {
    throw new Error(
      `Unknown benchmark: ${name}. Choose from: ${Object.keys(benchmarks).join(', ')}`
    )
  }
  return name
}
