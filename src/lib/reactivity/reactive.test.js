import test from 'tape'
import { reactive } from './reactive.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof reactive

  assert.equal(actual, expected, 'Reactive should be a function')
  assert.end()
})
