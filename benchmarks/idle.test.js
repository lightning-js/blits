import assert from 'node:assert/strict'
import test from 'node:test'
import { untilIdle, updateIdle } from './src/benchmark-utils.js'

test('an update waits for existing renderer activity before starting its own transition', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  updateIdle(false)
  let updates = 0
  let finished = false
  const pending = untilIdle(() => updates++).then(() => {
    finished = true
  })
  assert.equal(updates, 0)
  updateIdle(true)
  await Promise.resolve()
  assert.equal(updates, 1)
  assert.equal(finished, false)
  updateIdle(false)
  updateIdle(true)
  await pending
  // The completed wait must not leave its timeout armed.
  t.mock.timers.tick(30_000)
  assert.equal(finished, true)
})

test('a stale idle event cannot complete an update that started idle', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  updateIdle(true)
  let finished = false
  const pending = untilIdle(() => {}).then(() => {
    finished = true
  })
  updateIdle(true)
  await Promise.resolve()
  assert.equal(finished, false)
  updateIdle(false)
  updateIdle(true)
  await pending
  assert.equal(finished, true)
})

test('renderer timeouts remain errors and report the observed transitions', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  updateIdle(true)
  const pending = untilIdle(() => {})
  const rejected = assert.rejects(pending, /active observed: false, idle events: 1/)
  updateIdle(true)
  t.mock.timers.tick(30_000)
  await rejected
})
