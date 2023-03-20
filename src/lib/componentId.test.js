import test from 'tape'
import { createHumanReadableId, createInternalId } from './componentId.js'

test('Type createHumandReadableId', (assert) => {
  const expected = 'function'
  const actual = typeof createHumanReadableId

  assert.equal(actual, expected, 'createHumanReadableId should be a function')
  assert.end()
})

test('Returns a readable id, based on a counter and component name', (assert) => {
  const expected = 'BoltComponent::Spinner_1'
  const actual = createHumanReadableId('Spinner')

  assert.equal(actual, expected, 'createHumanReadableId should return correct ID')
  assert.end()
})

test('Returns a readable id with incremented count', (assert) => {
  const expected = 'BoltComponent::Spinner_2'
  const actual = createHumanReadableId('Spinner')

  assert.equal(actual, expected, 'createHumanReadableId should return correct ID')
  assert.end()
})

test('Has a seperate count per component name', (assert) => {
  const expected = 'BoltComponent::Card_1'
  const actual = createHumanReadableId('Card')

  assert.equal(actual, expected, 'createHumanReadableId should return correct ID')
  assert.end()
})

test('Type createInternalId', (assert) => {
  const expected = 'function'
  const actual = typeof createInternalId

  assert.equal(actual, expected, 'createInternalId should be a function')
  assert.end()
})

test('Returns an internal id, disregarding the component name', (assert) => {
  const expected = 1
  const actual = createInternalId('Spinner')

  assert.equal(actual, expected, 'createInternalId should return correct ID')
  assert.end()
})

test('Returns an id with incremented counter', (assert) => {
  const expected = 2
  const actual = createInternalId('Spinner')

  assert.equal(actual, expected, 'createInternalId should return correct ID')
  assert.end()
})

test('Uses the same counter for all components', (assert) => {
  const expected = 3
  const actual = createInternalId('Card')

  assert.equal(actual, expected, 'createInternalId should return correct ID')
  assert.end()
})
