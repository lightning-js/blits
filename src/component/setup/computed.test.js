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
import { reactive } from '../../lib/reactivity/reactive.js'
import { effect } from '../../lib/reactivity/effect.js'
import { flushJobs } from '../../lib/reactivity/scheduler.js'

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
  // invalidation flows through reactive dependencies (same as Vue):
  // the computed closes over reactive state and `this` chains inner computeds
  const state = reactive({ firstName: 'Jane', lastName: 'Smith' })
  const component = setup({
    fullName() {
      return `${state.firstName} ${state.lastName}`
    },
    description() {
      return `Name: ${this.fullName}`
    },
  })

  assertComputed(t, component, { fullName: 'Jane Smith', description: 'Name: Jane Smith' })
  state.firstName = 'John'
  flushJobs()
  assertComputed(t, component, { fullName: 'John Smith', description: 'Name: John Smith' })
  t.end()
})

test('Repeated reads evaluate once', (t) => {
  let evaluations = 0
  const component = setup({
    value() {
      evaluations++
      return 'cached'
    },
  })

  t.equal(component.value, 'cached', 'First read evaluates')
  t.equal(component.value, 'cached', 'Second read uses cache')
  t.equal(component.value, 'cached', 'Third read uses cache')
  t.equal(evaluations, 1, 'User function ran exactly once')
  t.end()
})

test('Chained computeds evaluate once per change', (t) => {
  const state = reactive({ first: 'Jane', last: 'Smith' })
  let fullRuns = 0
  let descRuns = 0
  const component = setup({
    fullName() {
      fullRuns++
      return `${state.first} ${state.last}`
    },
    description() {
      descRuns++
      return `Name: ${this.fullName}`
    },
  })

  t.equal(component.description, 'Name: Jane Smith', 'Outer computed resolves through inner')
  t.equal(fullRuns, 1, 'Inner evaluated once')
  t.equal(descRuns, 1, 'Outer evaluated once')
  t.equal(component.description, 'Name: Jane Smith', 'Repeat read uses caches')
  t.equal(fullRuns, 1, 'Inner not re-evaluated')
  t.equal(descRuns, 1, 'Outer not re-evaluated')

  state.first = 'John'
  flushJobs()

  t.equal(component.description, 'Name: John Smith', 'Chain reflects dep change')
  t.equal(fullRuns, 2, 'Inner re-evaluated once')
  t.equal(descRuns, 2, 'Outer re-evaluated once')
  t.end()
})

test('Multiple dep changes batch into one recompute and one downstream run', (t) => {
  const state = reactive({ a: 1, b: 2 })
  let evaluations = 0
  let runs = 0
  const component = setup({
    sum() {
      evaluations++
      return state.a + state.b
    },
  })

  effect(() => {
    component.sum
    runs++
  })
  t.equal(runs, 1, 'Downstream effect ran initially')
  t.equal(evaluations, 1, 'Computed evaluated initially')

  state.a = 10
  state.b = 20
  flushJobs()

  t.equal(component.sum, 30, 'Computed reflects both changes')
  t.equal(evaluations, 2, 'Computed re-evaluated exactly once for both changes')
  t.equal(runs, 2, 'Downstream effect re-ran exactly once for both changes')
  t.end()
})

test('Caches are isolated per instance', (t) => {
  let evaluations = 0
  const computeds = {
    greet() {
      evaluations++
      return `hi ${this.firstName}`
    },
  }
  const first = setup(computeds, { firstName: 'Jane' })
  const second = setup(computeds, { firstName: 'John' })

  t.equal(first.greet, 'hi Jane', 'First instance computes its own value')
  t.equal(first.greet, 'hi Jane', 'First instance caches')
  t.equal(second.greet, 'hi John', 'Second instance computes its own value')
  t.equal(evaluations, 2, 'One evaluation per instance, not per read')
  t.end()
})
