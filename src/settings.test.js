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

import { test } from 'tap'
import settings from './settings.js'

test('Settings - Set a new key ', (assert) => {
  settings.set('a', 1000)
  assert.equal(settings.get('a'), 1000, 'set and get a new key should work correctly')
  assert.end()
})

test('Settings - Set an existing key ', (assert) => {
  settings.set('a', 2000)
  assert.equal(settings.get('a'), 2000, 'set and get an existing key should work correctly')
  assert.end()
})

test('Settings - Set multiple keys ', (assert) => {
  settings.set({ b: 'test', c: true })
  assert.equal(settings.get('b'), 'test', 'get should return the correct value for key b')
  assert.equal(settings.get('c'), true, 'get should return the correct value for key c')
  assert.end()
})

test('Settings - Get a non-existing key ', (assert) => {
  assert.equal(settings.get('nonExisting'), null, 'get a non-existing key returns null by default')
  assert.equal(
    settings.get('nonExisting', 'defaultValue'),
    'defaultValue',
    'get a non-existing key returns the provided default value'
  )
  assert.end()
})
