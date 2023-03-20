import test from 'tape'
import Component from './component.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof Component

  assert.equal(actual, expected, 'Component should be a function')
  assert.end()
})

test('Component - Factory function', (assert) => {
  const expected = 'function'
  const actual = typeof Component('my component', {})

  assert.equal(actual, expected, 'Component should be a factory function (i.e. return a function)')
  assert.end()
})

test('Component - Factory requires a name to be passed', (assert) => {
  assert.throws(() => {
    Component()
  }, 'Thorw an error when no name argument has been passed')

  assert.end()
})

test('Component - Factory requires a name to be passed', (assert) => {
  assert.throws(() => {
    Component()
  }, 'Throw an error when no name argument has been passed')

  assert.end()
})
