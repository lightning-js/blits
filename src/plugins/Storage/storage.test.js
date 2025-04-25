/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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
import storagePlugin from './storage.js'

const storage = storagePlugin.plugin()

test('Storage - get non existent key', (assert) => {
  const key = 'nonexistentkey'
  const expected = null
  const actual = storage.get(key)

  assert.equal(actual, expected, 'Get method should return null for non-existent key')
  assert.end()
})

test('Storage - set key value pair', (assert) => {
  const key = 'setkey'
  const value = 'setValue'
  const expected = true
  const actual = storage.set(key, value)

  assert.equal(actual, expected, 'Set should return true for valid key-value pair')
  assert.end()
})

test('Storage - set with value that throws error', (assert) => {
  const key = 'setKey'
  const value = {
    get foo() {
      throw new Error('Test error')
    },
  }
  const actual = storage.set(key, value)
  assert.equal(actual, false, 'Set should return false for value that throws error')
  assert.end()
})

test('Storage - get existing key', (assert) => {
  const key = 'setKey'
  const value = 'setValue'
  storage.set(key, value)
  const expected = value
  const actual = storage.get(key)

  assert.deepEqual(actual, expected, 'Get should return the correct value for existing key')
  assert.end()
})

test('Storage - remove key', (assert) => {
  const key = 'setKey'
  storage.set(key, 'setValue')
  storage.remove(key)
  const expected = null
  const actual = storage.get(key)

  assert.equal(actual, expected, 'Remove should delete the key-value pair')
  assert.end()
})

test('Storage - clear', (assert) => {
  const key1 = 'setKey1'
  const key2 = 'setKey2'
  storage.set(key1, 'setValue1')
  storage.set(key2, 'setValue2')
  storage.clear()
  const expected1 = null
  const expected2 = null
  const actual1 = storage.get(key1)
  const actual2 = storage.get(key2)

  assert.equal(actual1, expected1, 'Clear should delete the first key-value pair')
  assert.equal(actual2, expected2, 'Clear should delete the second key-value pair')
  assert.end()
})
