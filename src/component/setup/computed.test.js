/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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
import computedFn from './computed.js'
import symbols from '../../lib/symbols.js'

// --- Helpers ---
const setup = (computeds = {}, values = {}) => {
  const component = {}
  Object.assign(component, values)
  computedFn(component, computeds)
  return component
}

const assertComputed = (t, component, keyValues) => {
  for (const [key, expected] of Object.entries(keyValues)) {
    t.equal(component[key], expected, `${key} should compute correctly`)
  }
}

// --- Tests ---

test('Basic computed functionality', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.firstName} ${this.lastName}`
      },
      isAdult() {
        return this.age >= 18
      },
    },
    { firstName: 'John', lastName: 'Doe', age: 25 }
  )

  t.deepEqual(
    component[symbols.computedKeys],
    ['fullName', 'isAdult'],
    'Should store computed keys'
  )
  assertComputed(t, component, { fullName: 'John Doe', isAdult: true })
  t.end()
})

test('Conflict detection', (t) => {
  const component = setup(
    {
      name() {
        return 'conflict'
      },
      title() {
        return 'conflict'
      },
      submit() {
        return 'conflict'
      },
      validComputed() {
        return 'works'
      },
    },
    {
      [symbols.stateKeys]: ['name'],
      [symbols.propKeys]: ['title'],
      [symbols.methodKeys]: ['submit'],
    }
  )

  t.deepEqual(
    component[symbols.computedKeys],
    ['validComputed'],
    'Only non-conflicting computed added'
  )
  t.equal(component.validComputed, 'works', 'Valid computed works')
  t.end()
})

test('Non-function computeds', (t) => {
  const component = setup({
    validFunction() {
      return 'valid'
    },
    invalidString: 'not a function',
    invalidNumber: 42,
  })

  t.deepEqual(
    component[symbols.computedKeys].sort(),
    ['validFunction', 'invalidNumber', 'invalidString'].sort(),
    'All keys should be included'
  )
  t.equal(component.validFunction, 'valid', 'Valid function computes correctly')
  t.end()
})

test('Edge cases & empty', (t) => {
  const emptyComp = setup({})
  const singleComp = setup({
    testComputed() {
      return 'test'
    },
  })

  t.deepEqual(emptyComp[symbols.computedKeys], [], 'Empty computeds produce empty keys')
  t.deepEqual(singleComp[symbols.computedKeys], ['testComputed'], 'Single computed added')
  t.equal(singleComp.testComputed, 'test', 'Computed works correctly')
  t.end()
})

test('Dynamic updates', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.firstName} ${this.lastName}`
      },
      description() {
        return `Name: ${this.fullName}`
      },
    },
    { firstName: 'Jane', lastName: 'Smith' }
  )

  assertComputed(t, component, { fullName: 'Jane Smith', description: 'Name: Jane Smith' })
  component.firstName = 'John'
  assertComputed(t, component, { fullName: 'John Smith', description: 'Name: John Smith' })
  t.end()
})
