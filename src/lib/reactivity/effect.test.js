import test from 'tape'
import { trigger, track } from './effect.js'

test('Trigger - type', (assert) => {
  const expected = 'function'
  const actual = typeof trigger

  assert.equal(actual, expected, 'Trigger should be a function')
  assert.end()
})

test('Track type', (assert) => {
  const expected = 'function'
  const actual = typeof track

  assert.equal(actual, expected, 'Track should be a function')
  assert.end()
})
