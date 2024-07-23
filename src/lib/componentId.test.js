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
import { createHumanReadableId, createInternalId, resetCounter } from './componentId.js'

test('Type createHumandReadableId', (assert) => {
  const expected = 'function'
  const actual = typeof createHumanReadableId

  assert.equal(actual, expected, 'createHumanReadableId should be a function')
  assert.end()
})

test('Returns a readable id, based on a counter and component name', (assert) => {
  const expected = 'BlitsComponent::Spinner_1'
  const actual = createHumanReadableId('Spinner')

  assert.equal(actual, expected, 'createHumanReadableId should return correct ID')
  assert.end()
})

test('Returns a readable id with incremented count', (assert) => {
  const expected = 'BlitsComponent::Spinner_2'
  const actual = createHumanReadableId('Spinner')

  assert.equal(actual, expected, 'createHumanReadableId should return correct ID')
  assert.end()
})

test('Has a seperate count per component name', (assert) => {
  const expected = 'BlitsComponent::Card_1'
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
  resetCounter()
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
