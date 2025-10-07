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
import { reactive } from './reactive.js'
import { effect } from './effect.js'
import symbols from '../symbols.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof reactive

  assert.equal(actual, expected, 'Reactive should be a function')
  assert.end()
})

test('Reactive - Assign new object to reactive property', (assert) => {
  const data = reactive({ nested: { foo: 'foo' }, count: 0 })

  const nonReactiveData = { count: 0 }

  const basicEffect = () => {
    data.nested.foo // track nested.foo
    data.count // track count
    nonReactiveData.count++ // not tracked since nonReactiveData is not reactive
  }

  effect(basicEffect)
  assert.equal(
    nonReactiveData.count,
    1,
    'Effect should run once initially and increment nonReactiveData count'
  )

  data.nested = { foo: 'bar' } // should trigger effect
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should run again after assigning a new object to a reactive property and increment nonReactiveData count'
  )
  assert.end()
})

test('Reactive - Non object prototype should not be converted to Proxy', (assert) => {
  const date = new Date()
  const originalObj = date
  const proxiedObj = reactive(originalObj)

  assert.equal(proxiedObj, originalObj, 'Reactive should return the original object')
  assert.end()
})

test('Reactive - Check reactive object is a proxy or not', (assert) => {
  const proxiedObj = reactive({ a: 100, b: 200 })

  assert.deepEqual(proxiedObj[symbols.isProxy], true, 'Reactive object should be a proxy')
  assert.end()
})

test('Reactive - Get raw object from proxy', (assert) => {
  const originalObj = { a: 100, b: 200 }
  const proxiedObj = reactive(originalObj)

  assert.deepEqual(
    proxiedObj[symbols.raw],
    originalObj,
    'Should return the original object from the proxy using the raw symbol'
  )
  assert.end()
})

test('Reactive - Basic object reactivity using defineProperty mode', (assert) => {
  const data = reactive({ foo: 'foo', count: 0 }, 'defineProperty')

  const nonReactiveData = { count: 0 }

  const basicEffect = () => {
    data.foo // track foo
    data.count // track count
    nonReactiveData.count++ // not tracked since nonReactiveData is not reactive
  }

  effect(basicEffect)
  assert.equal(
    nonReactiveData.count,
    1,
    'Effect should run once initially and increment nonReactiveData count'
  )

  data.foo = 'bar' // should trigger effect
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should run again after modifying a property and increment nonReactiveData count'
  )

  data.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should NOT run again after modifying a property to the same value'
  )
  data.foo = 'baz' // should trigger effect
  assert.equal(
    nonReactiveData.count,
    3,
    'Effect should run again after modifying a property and increment nonReactiveData count'
  )
  assert.end()
})

test('Reactive - Nested object reactivity using defineProperty mode', (assert) => {
  const data = reactive(
    {
      nested: {
        foo: 'foo',
      },
      count: 0,
    },
    'defineProperty'
  )

  const nonReactiveData = { count: 0 }

  const basicEffect = () => {
    data.nested.foo // track nested.foo
    data.count // track count
    nonReactiveData.count++ // not tracked since nonReactiveData is not reactive
  }

  effect(basicEffect)
  assert.equal(
    nonReactiveData.count,
    1,
    'Effect should run once initially and increment nonReactiveData count'
  )

  data.nested.foo = 'bar' // should trigger effect
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should run again after modifying a nested property and increment nonReactiveData count'
  )
  data.nested.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should NOT run again after modifying a nested property to the same value'
  )
  data.nested.foo = 'baz' // should trigger effect
  assert.equal(
    nonReactiveData.count,
    3,
    'Effect should run again after modifying a nested property and increment nonReactiveData count'
  )
  assert.end()
})

test('Reactive - Array reactivity using defineProperty mode', (assert) => {
  const data = reactive(
    {
      list: ['one', 'two', 'three'],
      count: 0,
    },
    'defineProperty'
  )

  const nonReactiveData = { count: 0 }

  const basicEffect = () => {
    data.list // track list
    data.count // track count
    nonReactiveData.count++
  }

  effect(basicEffect)
  assert.equal(
    nonReactiveData.count,
    1,
    'Effect should run once initially and increment nonReactiveData count'
  )

  data.list.push('four') // should trigger effect
  assert.equal(
    nonReactiveData.count,
    2,
    'Effect should run again after modifying an array and increment nonReactiveData count to 2'
  )

  data.list.push('four') // should trigger effect (arrays can have duplicate values)
  assert.equal(
    nonReactiveData.count,
    3,
    'Effect should run again after modifying an array and increment nonReactiveData count to 3'
  )

  data.list.splice(1, 1) // should trigger effect
  assert.equal(
    nonReactiveData.count,
    4,
    'Effect should run again after modifying an array and increment nonReactiveData count to 4'
  )
  assert.end()
})
