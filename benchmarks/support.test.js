import assert from 'node:assert/strict'
import test from 'node:test'
import { checkBenchmarkSupport, requireBenchmarkSupport } from './src/support.js'

test('only an explicit reason marks a workload unsupported', async () => {
  assert.equal(await checkBenchmarkSupport('Test'), undefined)
  assert.equal(await checkBenchmarkSupport('Test', () => undefined), undefined)
  assert.deepEqual(await checkBenchmarkSupport('Test', async () => 'Requires feature X'), {
    title: 'Test',
    status: 'unsupported',
    reason: 'Requires feature X',
  })
  for (const result of [false, true, null, '', ' ']) {
    await assert.rejects(
      checkBenchmarkSupport('Test', () => result),
      /non-empty reason/
    )
  }
  await assert.rejects(
    checkBenchmarkSupport('Test', () => {
      throw new Error('Unexpected bug')
    }),
    /Unexpected bug/
  )
})

test('unsupported results are allowed only when explicitly enabled for a baseline', () => {
  const result = { status: 'unsupported', reason: 'Requires feature X' }
  assert.doesNotThrow(() => requireBenchmarkSupport(result, true))
  assert.throws(() => requireBenchmarkSupport(result), /Benchmark unsupported: Requires feature X/)
  assert.throws(() => requireBenchmarkSupport(result, false), /Benchmark unsupported/)
  assert.doesNotThrow(() => requireBenchmarkSupport({ medianGenerationSyncMs: 1 }))
})
