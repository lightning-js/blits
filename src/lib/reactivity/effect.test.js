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
import {
  trigger,
  track,
  effect,
  pauseTracking,
  resumeTracking,
  removeEffects,
  createComputed,
  batch,
} from './effect.js'
import { reactive } from './reactive.js'
import symbols from '../symbols.js'

test('Batch defers and deduplicates ordinary consumers in both reactivity modes', (assert) => {
  for (const mode of ['Proxy', 'defineProperty']) {
    const state = reactive({ first: 0, second: 0 }, mode)
    const values = []
    const render = () => values.push([state.first, state.second])
    effect(render)

    const result = batch(() => {
      state.first = 1
      batch(() => {
        state.second = 2
      })
      assert.equal(state.second, 2, `${mode}: state writes are immediate`)
      assert.equal(values.length, 1, `${mode}: nested batches do not flush early`)
      return 42
    })

    assert.equal(result, 42, `${mode}: returns the callback result`)
    assert.deepEqual(
      values,
      [
        [0, 0],
        [1, 2],
      ],
      `${mode}: flushes once before returning`
    )
    state.first = 3
    assert.deepEqual(values[2], [3, 2], `${mode}: later writes remain synchronous`)
    removeEffects([render])
  }
  assert.end()
})

test('Batch keeps computed chains fresh and shares calculations across consumers', (assert) => {
  const state = reactive({ price: 10, quantity: 2 })
  const component = { [symbols.effects]: [] }
  let calls = 0
  const total = createComputed(
    () => {
      calls++
      return state.price * state.quantity
    },
    component,
    'total'
  )
  const doubled = createComputed(() => total() * 2, component, 'doubled')
  const values = []
  const first = () => values.push([state.price, doubled()])
  const second = () => total()
  effect(first)
  effect(second)

  batch(() => {
    state.price = 20
    state.quantity = 3
  })
  assert.equal(calls, 2, 'One new calculation is shared by both consumers')
  assert.deepEqual(
    values,
    [
      [10, 40],
      [20, 120],
    ],
    'Direct and computed subscriptions deduplicate'
  )

  batch(() => {
    state.price = 30
    assert.equal(doubled(), 180, 'An explicit read inside the batch sees current state')
    state.quantity = 4
    assert.equal(doubled(), 240, 'Later writes invalidate caches read inside the batch')
    assert.equal(values.length, 2, 'Explicit reads do not flush consumers')
  })
  assert.deepEqual(values[2], [30, 240], 'Consumers receive the final value')
  assert.equal(calls, 4, 'The flush reuses the latest explicit calculation')
  removeEffects([first, second, ...component[symbols.effects]])
  assert.end()
})

test('Batch skips removed consumers and preserves forced notifications', (assert) => {
  const target = {}
  let runs = 0
  let lastForce
  const render = (force) => {
    track(target, 'value')
    runs++
    lastForce = force
  }
  effect(render)
  batch(() => {
    trigger(target, 'value', true)
    trigger(target, 'value', false)
  })
  assert.equal(runs, 2, 'Repeated notifications run once')
  assert.equal(lastForce, true, 'A later notification does not erase force')
  batch(() => {
    trigger(target, 'value')
    removeEffects([render])
  })
  assert.equal(runs, 2, 'A consumer removed before flushing does not run')
  assert.end()
})

test('Batch keeps forced notifications local and upgrades dirty computed chains', (assert) => {
  const target = {}
  const component = { [symbols.effects]: [] }
  const first = createComputed(
    () => {
      track(target, 'first')
      return 42
    },
    component,
    'first'
  )
  const chained = createComputed(() => first(), component, 'chained')
  const seen = []
  const ordinary = (force) => {
    track(target, 'ordinary')
    seen.push(['ordinary', force])
  }
  const computed = (force) => {
    chained()
    seen.push(['computed', force])
  }
  effect(ordinary)
  effect(computed)
  seen.length = 0

  batch(() => {
    trigger(target, 'ordinary', false)
    trigger(target, 'first', false)
    trigger(target, 'first', true)
    trigger(target, 'first', false)
  })
  assert.deepEqual(
    seen,
    [
      ['ordinary', false],
      ['computed', true],
    ],
    'Forcing an already-dirty chain upgrades its consumers without forcing unrelated ones'
  )
  seen.length = 0
  batch(() => trigger(target, 'first', false))
  assert.deepEqual(seen, [['computed', false]], 'Force does not leak into the next batch')
  removeEffects([ordinary, computed, ...component[symbols.effects]])
  assert.end()
})

test('Batch restores the queue after callback and consumer errors', (assert) => {
  const state = reactive({ count: 0 })
  const values = []
  const render = () => values.push(state.count)
  effect(render)
  assert.throws(
    () =>
      batch(() => {
        state.count = 1
        throw new Error('Callback failed')
      }),
    /Callback failed/,
    'Callback errors propagate'
  )
  assert.deepEqual(values, [0, 1], 'Writes before the error are flushed')

  const throwing = () => {
    if (state.count === 2) throw new Error('Consumer failed')
  }
  effect(throwing)
  assert.throws(
    () =>
      batch(() => {
        state.count = 2
      }),
    /Consumer failed/,
    'Consumer errors propagate synchronously'
  )
  removeEffects([throwing])
  state.count = 3
  batch(() => {
    state.count = 4
  })
  assert.deepEqual(values, [0, 1, 2, 3, 4], 'Later updates and batches still work')
  removeEffects([render])
  assert.end()
})

test('Batch preserves the callback error when flushing also fails', (assert) => {
  const state = reactive({ count: 0 })
  const render = () => {
    if (state.count === 1) throw new Error('Consumer failure')
  }
  effect(render)
  const failure = new Error('Callback failure')
  let caught
  try {
    batch(() => {
      state.count = 1
      throw failure
    })
  } catch (error) {
    caught = error
  }
  assert.equal(caught, failure, 'The original callback error is not masked by a consumer error')
  assert.doesNotThrow(() => {
    state.count = 2
  }, 'The queue is released after both errors')
  removeEffects([render])
  assert.end()
})

test('Batch called inside a consumer preserves synchronous nested updates', (assert) => {
  const state = reactive({ first: 0, second: 0 })
  const order = []
  const observer = () => order.push(`second: ${state.second}`)
  const writer = () => {
    const value = state.first
    if (value !== 0) {
      order.push('writer starts')
      batch(() => {
        state.second = value
        state.second = value + 1
      })
      order.push('writer ends')
    }
  }
  const sibling = () => order.push(`first: ${state.first}`)
  effect(observer)
  effect(writer)
  effect(sibling)
  order.length = 0
  batch(() => {
    state.first = 1
  })
  assert.deepEqual(order, ['writer starts', 'second: 2', 'writer ends', 'first: 1'])
  removeEffects([sibling])
  order.length = 0
  batch(() => {
    state.first = 2
  })
  assert.deepEqual(
    order,
    ['writer starts', 'second: 3', 'writer ends'],
    'A nested flush can reuse the root queue after its last consumer is removed'
  )
  removeEffects([observer, writer, sibling])
  assert.end()
})

test('Trigger - type', (assert) => {
  const expected = 'function'
  const actual = typeof trigger

  assert.equal(actual, expected, 'Trigger should be a function')
  assert.end()
})

test('Track type', (assert) => {
  const expected = 'function'
  const actual = typeof track

  assert.equal(actual, expected, 'Track should be a function')
  assert.end()
})

test('Effect - Basic Effect', (assert) => {
  const data = { foo: 'foo', count: 0 }
  const basicEffect = () => {
    data.count++
  }
  effect(basicEffect)
  assert.equal(data.count, 1, 'Effect should run once initially and increment count')
  assert.end()
})

test('Tracking remains paused until every nested pause is resumed', (assert) => {
  const target = {}
  let effectRuns = 0

  effect(() => {
    track(target, 'value')
    effectRuns++
  })

  pauseTracking()
  pauseTracking()
  resumeTracking()

  trigger(target, 'value')

  assert.equal(
    effectRuns,
    1,
    'A nested resume should not enable tracking while an outer pause is still active'
  )

  resumeTracking()
  assert.end()
})

test('Effect - Restores tracking state when an effect throws', (assert) => {
  const failedTarget = {}
  const unrelatedTarget = {}
  let failedEffectRuns = 0

  const failedEffect = () => {
    failedEffectRuns++
    track(failedTarget, 'failed')
    throw new Error('Effect failed')
  }

  assert.throws(
    () => effect(failedEffect),
    /Effect failed/,
    'Effect should propagate the original error'
  )

  // Reads outside an effect must not be attributed to the effect that failed.
  track(unrelatedTarget, 'unrelated')

  assert.doesNotThrow(
    () => trigger(unrelatedTarget, 'unrelated'),
    'Unrelated reactive properties should not trigger the failed effect'
  )
  assert.equal(
    failedEffectRuns,
    1,
    'Failed effect should not be registered on unrelated properties'
  )

  assert.end()
})

test('Effect - Restores the enclosing effect when a nested effect throws', (assert) => {
  const outerTarget = {}
  const innerTarget = {}
  let outerEffectRuns = 0

  const innerEffect = () => {
    track(innerTarget, 'inner')
    throw new Error('Nested effect failed')
  }

  const outerEffect = () => {
    outerEffectRuns++

    if (outerEffectRuns === 1) {
      assert.throws(
        () => effect(innerEffect, 'inner'),
        /Nested effect failed/,
        'Nested effect should propagate the original error'
      )
    }

    // Tracking must resume with both the enclosing effect and its key.
    track(outerTarget, 'outer')
  }

  effect(outerEffect, 'outer')
  trigger(outerTarget, 'outer')

  assert.equal(outerEffectRuns, 2, 'Enclosing effect should keep tracking after the nested error')
  assert.end()
})

test('Computed tracking restores filters, discovers dependencies, and cleans up its runner', (assert) => {
  const target = {}
  let ready = false
  let runs = 0
  let lastForce
  const getter = function () {
    track(target, 'ready')
    if (ready) track(target, 'cards')
    return this.value
  }
  const component = { value: 42 }
  const read = createComputed(getter, component, 'visibleCards')
  const render = (force) => {
    runs++
    lastForce = force
    assert.equal(read(), 42, 'Getter preserves its receiver and result')
    track(target, 'childOnly')
    track(target, 'range')
  }
  effect(render, ['visibleCards', 'range'])
  trigger(target, 'childOnly')
  assert.equal(runs, 1, 'Reads after the getter remain filtered')

  ready = true
  trigger(target, 'ready', true)
  assert.equal(runs, 2, 'Computed dependencies trigger the effect')
  assert.equal(lastForce, true, 'Computed runner forwards the force flag')
  trigger(target, 'cards')
  assert.equal(runs, 3, 'Dependencies first read on an update are tracked')
  trigger(target, 'childOnly')
  assert.equal(runs, 3, 'Update tracking also excludes child-only reads')
  trigger(target, 'range')
  assert.equal(runs, 4, 'The original filtered dependencies remain active')

  removeEffects([render])
  trigger(target, 'ready')
  trigger(target, 'cards')
  trigger(target, 'range')
  assert.equal(runs, 4, 'Cleanup removes both computed and direct subscriptions')
  assert.end()
})

test('Nested and throwing computed getters restore the outer tracking filter', (assert) => {
  const target = {}
  let runs = 0
  const inner = createComputed(
    () => {
      track(target, 'inner')
      return 42
    },
    {},
    'inner'
  )
  const outer = createComputed(
    () => {
      const value = inner()
      track(target, 'outer')
      return value
    },
    {},
    'computed'
  )
  const throwing = createComputed(
    () => {
      throw new Error('Computed failed')
    },
    {},
    'throwing'
  )
  const render = () => {
    runs++
    assert.equal(outer(), 42, 'Nested getter returns its result')
    assert.throws(() => throwing(), /Computed failed/, 'Getter errors propagate')
    track(target, 'unrelated')
  }
  effect(render, ['computed'])
  trigger(target, 'inner')
  trigger(target, 'outer')
  assert.equal(runs, 3, 'Both nested and outer dependencies trigger one execution each')
  trigger(target, 'unrelated')
  assert.equal(runs, 3, 'The original filter is restored even after an error')
  removeEffects([render])
  trigger(target, 'inner')
  trigger(target, 'outer')
  assert.equal(runs, 3, 'Nested computed subscriptions are cleaned up')
  assert.end()
})

test('Computed tracking respects paused tracking and reads outside effects', (assert) => {
  const target = {}
  let runs = 0
  const getter = createComputed(
    () => {
      track(target, 'cards')
      return []
    },
    {},
    'computed'
  )
  const render = () => {
    runs++
    pauseTracking()
    try {
      getter()
    } finally {
      resumeTracking()
    }
  }
  effect(render, ['computed'])
  getter()
  trigger(target, 'cards')
  assert.equal(runs, 1, 'Paused and non-effect reads do not subscribe')
  removeEffects([render])
  assert.end()
})
