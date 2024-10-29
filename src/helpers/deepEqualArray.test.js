/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'tape'
import deepEqual from './deepEqualArray.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof deepEqual

  assert.equal(actual, expected, 'deepEqual should be a function')
  assert.end()
})

test('The same arrays', (assert) => {
  const val1 = ['hello', 'world']

  assert.true(
    deepEqual(val1, val1),
    'deepEqual should return true if the values are the same reference'
  )
  assert.end()
})

test('Equal simple arrays', (assert) => {
  const val1 = ['hello', 'world']
  const val2 = ['hello', 'world']

  assert.true(deepEqual(val1, val2), 'deepEqual should return true if simple arrays are equal')
  assert.end()
})

test('Not equal simple arrays', (assert) => {
  const val1 = ['hello', 'world']
  const val2 = ['world', 'hello']

  assert.false(
    deepEqual(val1, val2),
    'deepEqual should return false if simple arrays are not equal'
  )
  assert.end()
})

test('Not Equal simple arrays (different length)', (assert) => {
  const val1 = ['hello', 'world']
  const val2 = ['hello', 'world', '!']

  assert.false(deepEqual(val1, val2), 'deepEqual should return false if simple arrays are equal')
  assert.end()
})

test('Equal nested arrays', (assert) => {
  const val1 = ['hello', ['world', '!']]
  const val2 = ['hello', ['world', '!']]

  assert.true(deepEqual(val1, val2), 'deepEqual should return true if nested arrays are equal')
  assert.end()
})

test('Not equal nested arrays', (assert) => {
  const val1 = ['hello', ['world', '!']]
  const val2 = ['hello', ['world', '!', '?']]

  assert.false(
    deepEqual(val1, val2),
    'deepEqual should return false if nested arrays are not equal'
  )
  assert.end()
})

test('Equal arrays with objects', (assert) => {
  const val1 = [{ foo: 'bar', bar: 'foo' }, { hello: 'world' }]
  const val2 = [{ foo: 'bar', bar: 'foo' }, { hello: 'world' }]

  assert.true(
    deepEqual(val1, val2),
    'deepEqual should return true if arrays with objects are equal'
  )
  assert.end()
})

test('Not equal arrays with objects (keys', (assert) => {
  const val1 = [{ foo: 'bar', bar: 'foo' }, { test: 'bla' }]
  const val2 = [{ foo2: 'bar', bar2: 'foo' }, { test: 'bla' }]

  assert.false(
    deepEqual(val1, val2),
    'deepEqual should return false if arrays with objects are not equal'
  )
  assert.end()
})

test('Equal arrays with mixed values', (assert) => {
  const val1 = ['foo', { foo: 'bar', bar: 'foo' }, ['hello', 'world', ['this', 'is', { level: 2 }]]]
  const val2 = ['foo', { foo: 'bar', bar: 'foo' }, ['hello', 'world', ['this', 'is', { level: 2 }]]]

  assert.true(
    deepEqual(val1, val2),
    'deepEqual should return true if arrays with mixed values are equal'
  )
  assert.end()
})

test('Not Equal arrays with mixed values', (assert) => {
  const val1 = ['foo', { foo: 'bar', bar: 'foo' }, ['hello', 'world', ['this', 'is', { level: 2 }]]]
  const val2 = ['foo', { foo: 'bar', bar: 'foo' }, ['hello', 'world', ['this', 'is', { level: 3 }]]]

  assert.false(
    deepEqual(val1, val2),
    'deepEqual should return true if arrays with mixed values are not equal'
  )
  assert.end()
})
