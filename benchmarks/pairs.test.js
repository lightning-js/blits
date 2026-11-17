import assert from 'node:assert/strict'
import test from 'node:test'
import { runPairs } from './pairs.js'

test('checkpoints retain completed launches when a later launch fails', async () => {
  const checkpoints = []
  const calls = []
  const failure = new Error('Browser launch failed')
  await assert.rejects(
    runPairs(
      3,
      async (side, index) => {
        calls.push(`${index}:${side}`)
        if (index === 1 && side === 'base') throw failure
        return { result: `${index}:${side}` }
      },
      async (pairs) => checkpoints.push(structuredClone(pairs))
    ),
    (error) => error === failure
  )
  assert.deepEqual(calls, ['0:base', '0:candidate', '1:candidate', '1:base'])
  assert.deepEqual(checkpoints.at(-1), [
    {
      order: ['base', 'candidate'],
      base: { result: '0:base' },
      candidate: { result: '0:candidate' },
    },
    { order: ['candidate', 'base'], candidate: { result: '1:candidate' } },
  ])
})

test('a completed comparison returns the full alternating pairs', async () => {
  let checkpoint
  const pairs = await runPairs(
    2,
    async (side, index) => ({ result: `${index}:${side}` }),
    async (pairs) => {
      checkpoint = structuredClone(pairs)
    }
  )
  assert.deepEqual(checkpoint, pairs)
  assert.deepEqual(
    pairs.map((pair) => pair.order),
    [
      ['base', 'candidate'],
      ['candidate', 'base'],
    ]
  )
  assert.ok(pairs.every((pair) => pair.base && pair.candidate))
})
