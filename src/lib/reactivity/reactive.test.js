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
import { reactive } from './reactive.js'
import { effect, pauseTracking, resumeTracking } from './effect.js'
import symbols from '../symbols.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof reactive

  assert.equal(actual, expected, 'Reactive should be a function')
  assert.end()
})

test('Reactive - Basic Object Reactivity', (assert) => {
  const data = reactive({ foo: 'foo', count: 0 })

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a property and increment counter'
  )

  data.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    counter,
    2,
    'Effect should NOT run again after modifying a property to the same value'
  )

  data.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a property and increment counter'
  )
  assert.end()
})

test('Reactive - Nested Object Reactivity', (assert) => {
  const data = reactive({
    nested: {
      foo: 'foo',
    },
    count: 0,
  })

  let counter = 0

  const basicEffect = () => {
    data.nested.foo // track nested.foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.nested.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a nested property and increment counter'
  )
  data.nested.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    counter,
    2,
    'Effect should NOT run again after modifying a nested property to the same value'
  )

  data.nested.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a nested property and increment counter'
  )
  assert.end()
})

test('Reactive - Array Reactivity', (assert) => {
  const data = reactive({
    list: ['one', 'two', 'three'],
    count: 0,
  })

  let counter = 0

  const basicEffect = () => {
    data.list // track list
    data.count // track count
    counter++
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.list.push('four') // should trigger effect
  assert.equal(counter, 2, 'Effect should run again after modifying an array and increment counter')

  data.list.push('four') // should trigger effect (arrays can have duplicate values)
  assert.equal(counter, 3, 'Effect should run again after modifying an array and increment counter')

  data.list.splice(1, 1) // should trigger effect
  assert.equal(counter, 4, 'Effect should run again after modifying an array and increment counter')

  data.list[0] = 'zero' // should trigger effect
  assert.equal(
    counter,
    5,
    'Effect should run again after modifying an array item and increment counter'
  )

  data.list[0] = 'zero' // should NOT trigger effect since value did not change
  assert.equal(
    counter,
    5,
    'Effect should NOT run again after modifying an array item to the same value'
  )

  data.list = ['updated', 'updated'] // should trigger effect
  assert.equal(
    counter,
    6,
    'Effect should run again after replacing the array and increment counter'
  )
  assert.end()
})

test('Reactive - Effect with specific keys', (assert) => {
  const data = reactive({ foo: 'foo', bar: 'bar', count: 0 })

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.bar // NOT tracked
    data.count // NOT tracked
    counter++
  }

  // effect should only tracked on data.foo
  effect(basicEffect, 'foo')
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying the tracked property and increment counter'
  )

  data.bar = 'baz' // should NOT trigger effect since bar is not tracked
  assert.equal(counter, 2, 'Effect should NOT run again after modifying an untracked property')

  data.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying the tracked property and increment counter'
  )
  assert.end()
})

test('Reactive - Multiple effects Tracking & Triggering for same object', (assert) => {
  const data = reactive({ foo: 'foo', count: 0 }, 'Proxy', true)

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.count // track count
    counter++
  }

  const anotherEffect = () => {
    data.foo // track foo
    data.count // track count
    counter += 10
  }

  effect(basicEffect)
  effect(anotherEffect)
  assert.equal(counter, 11, 'Both effects should run once initially and increment counter')

  data.foo = 'bar' // should trigger both effects
  assert.equal(
    counter,
    22,
    'Both effects should run again after modifying a property and increment counter'
  )
  assert.end()
})

test('Reactive - Assign new object to reactive property', (assert) => {
  const data = reactive({ nested: { foo: 'foo' }, count: 0 })

  let counter = 0

  const basicEffect = () => {
    data.nested.foo // track nested.foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.nested = { foo: 'bar' } // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after assigning a new object to a reactive property and increment counter'
  )
  assert.end()
})

test('Reactive - Get raw object from proxy', (assert) => {
  const originalObj = { a: 100, b: 200 }
  const proxiedObj = reactive(originalObj)

  assert.same(
    proxiedObj[symbols.raw],
    originalObj,
    'Should return the original object from the proxy using the raw symbol'
  )

  assert.not(originalObj, proxiedObj, 'Original object should not be equal to proxied object')
  assert.end()
})

test('Reactive - Check reactive object is a proxy or not', (assert) => {
  const proxiedObj = reactive({ a: 100, b: 200 })

  assert.same(proxiedObj[symbols.isProxy], true, 'Reactive object should be a proxy')
  assert.end()
})

test('Reactive - Non object prototype should not be converted to Proxy', (assert) => {
  const date = new Date()
  const originalObj = date
  const proxiedObj = reactive(originalObj)

  assert.equal(proxiedObj, originalObj, 'Reactive should return the original object')
  assert.end()
})

test('Reactive - Effect with multiple specific keys', (assert) => {
  const data = reactive({ foo: 'foo', bar: 'bar', count: 0 })

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.bar // track bar
    data.count // NOT tracked
    counter++
  }
  effect(basicEffect, ['foo', 'bar'])
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a tracked property and increment counter'
  )

  data.bar = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a tracked property and increment counter'
  )

  data.count = 1 // should NOT trigger effect since count is not tracked
  assert.equal(counter, 3, 'Effect should NOT run again after modifying an untracked property')

  data.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    4,
    'Effect should run again after modifying a tracked property and increment counter'
  )
  assert.end()
})

test('Reactive- Pause/Resume Tracking', (assert) => {
  const data = reactive({ foo: 'foo', count: 0 })

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a property and increment counter'
  )

  pauseTracking()

  data.foo = 'baz' // should NOT trigger effect since tracking is paused
  assert.equal(
    counter,
    2,
    'Effect should NOT run again after modifying a property while tracking is paused'
  )

  // resume tracking
  resumeTracking()

  data.foo = 'qux' // should trigger effect since tracking is resumed
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a property and increment counter'
  )
  assert.end()
})

test('Reactive - Basic object reactivity using defineProperty mode', (assert) => {
  const data = reactive({ foo: 'foo', count: 0 }, 'defineProperty')

  let counter = 0

  const basicEffect = () => {
    data.foo // track foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a property and increment counter'
  )

  data.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    counter,
    2,
    'Effect should NOT run again after modifying a property to the same value'
  )
  data.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a property and increment counter'
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

  let counter = 0

  const basicEffect = () => {
    data.list // track list
    data.count // track count
    counter++
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.list.push('four') // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying an array and increment counter to 2'
  )

  data.list.push('four') // should trigger effect (arrays can have duplicate values)
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying an array and increment counter to 3'
  )

  data.list.splice(1, 1) // should trigger effect
  assert.equal(
    counter,
    4,
    'Effect should run again after modifying an array and increment counter to 4'
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

  let counter = 0

  const basicEffect = () => {
    data.nested.foo // track nested.foo
    data.count // track count
    counter++ // not tracked since counter is not reactive
  }

  effect(basicEffect)
  assert.equal(counter, 1, 'Effect should run once initially and increment counter')

  data.nested.foo = 'bar' // should trigger effect
  assert.equal(
    counter,
    2,
    'Effect should run again after modifying a nested property and increment counter'
  )
  data.nested.foo = 'bar' // should NOT trigger effect since value did not change
  assert.equal(
    counter,
    2,
    'Effect should NOT run again after modifying a nested property to the same value'
  )
  data.nested.foo = 'baz' // should trigger effect
  assert.equal(
    counter,
    3,
    'Effect should run again after modifying a nested property and increment counter'
  )
  assert.end()
})
