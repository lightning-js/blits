import { test } from 'tap'
import Storage from './localCookie.js'

const ls = new Storage()
let cs = new Storage({ forceCookies: true })

test('Local Storage - Functions', (assert) => {
  assert.ok(ls instanceof Object, 'Local Storage should be an object')
  assert.ok(ls.setItem instanceof Function, 'Should have a setItem function')
  assert.ok(ls.removeItem instanceof Function, 'Should have a removeItem function')
  assert.ok(ls.clear instanceof Function, 'Should have a clear function')
  assert.ok(ls.keys instanceof Function, 'Should have a keys function')
  assert.end()
})

test('Local Storage - setItem key/value "a" with value "b"', (assert) => {
  const r = ls.setItem('a', 'b')
  assert.equal(r, undefined, 'Local Storage setItem function return should be undefined')
  assert.equal(ls.getItem('a'), 'b', 'Should return the same value "b" for key "a"')
  assert.end()
})

test('Local Storage - Remove item "a"', (assert) => {
  const r = ls.removeItem('a')
  assert.equal(r, undefined, 'Local storage removeItem function should return undefined')
  assert.equal(ls.getItem('a'), null, 'Should return a null value for key "a"')
  assert.end()
})

test('Local Storage - Should store a number as a string', (assert) => {
  ls.setItem('anumber', 1)
  assert.equal(typeof ls.getItem('anumber'), 'string', 'Should store a number as a string')
  assert.end()
})

test('Local Storage - Clear items ', (assert) => {
  ls.setItem('a', 'a')
  ls.setItem('b', 'b')
  const r = ls.clear()
  assert.equal(r, undefined, 'Local storage clear function should return undefined')
  assert.equal(ls.getItem('a'), null, 'Should not have a value for key "a"')
  assert.equal(ls.getItem('b'), null, 'Should not have a value for key "b"')

  assert.end()
})

test('Local Storage - keys', (assert) => {
  ls.setItem('a', 1)
  ls.setItem('b', 2)
  const keys = ls.keys()
  assert.equal(keys.length, 2, 'Keys length should be equal to 2')
  assert.equal(keys[0], 'a', 'First key should be "a"')
  assert.equal(keys[1], 'b', 'Second key should be "b"')

  assert.end()
})

test('Cookies - Functions', (assert) => {
  assert.ok(cs instanceof Object, 'Cookies should be an object')
  assert.ok(cs.setItem instanceof Function, 'Cookies should have a setItem function')
  assert.ok(cs.removeItem instanceof Function, 'Cookies should have a removeItem function')
  assert.ok(cs.clear instanceof Function, 'Cookies should have a clear function')
  assert.ok(cs.keys instanceof Function, 'Should have a keys function')
  assert.end()
})

test('Cookies - setItem key/value "a" with value "b"', (assert) => {
  const r = cs.setItem('a', 'b')
  assert.equal(r, undefined, 'Cookies setItem function return should be undefined')
  assert.equal(cs.getItem('a'), 'b', 'Should return the same value "b" for key "a"')
  assert.end()
})

test('Cookies - Remove item "a"', (assert) => {
  const r = cs.removeItem('a')
  assert.equal(r, undefined, 'Cookies removeItem function should return undefined')
  assert.equal(cs.getItem('a'), null, 'Should return a null value for key "a"')
  assert.end()
})

test('Cookies- Should store a number as a string', (assert) => {
  cs.setItem('anumber', 1)
  assert.equal(typeof cs.getItem('anumber'), 'string', 'Should store a number as a string')
  cs.clear()
  assert.end()
})

test('Cookies - Clear items ', (assert) => {
  cs.setItem('a', 'a')
  cs.setItem('b', 'b')
  const r = cs.clear()
  assert.equal(r, undefined, 'Cookies clear function should return undefined')
  assert.equal(cs.getItem('a'), null, 'Should not have a value for key "a"')
  assert.equal(cs.getItem('b'), null, 'Should not have a value for key "b"')

  assert.end()
})

test('Cookies - Keys', (assert) => {
  cs.setItem('a', 1)
  cs.setItem('b', 2)
  const keys = cs.keys()
  assert.equal(keys.length, 2, 'Keys length should be equal to 2')
  assert.equal(keys[0], 'a', 'First key should be "a"')
  assert.equal(keys[1], 'b', 'Second key should be "b"')

  assert.end()
})
