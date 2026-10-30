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
  trackComputed,
} from './effect.js'

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
  const render = (force) => {
    runs++
    lastForce = force
    assert.equal(trackComputed(getter, component), 42, 'Getter preserves its receiver and result')
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
  const inner = () => {
    track(target, 'inner')
    return 42
  }
  const outer = () => {
    const value = trackComputed(inner)
    track(target, 'outer')
    return value
  }
  const throwing = () => {
    throw new Error('Computed failed')
  }
  const render = () => {
    runs++
    assert.equal(trackComputed(outer), 42, 'Nested getter returns its result')
    assert.throws(() => trackComputed(throwing), /Computed failed/, 'Getter errors propagate')
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
  const getter = () => {
    track(target, 'cards')
    return []
  }
  const render = () => {
    runs++
    pauseTracking()
    try {
      trackComputed(getter)
    } finally {
      resumeTracking()
    }
  }
  effect(render, ['computed'])
  trackComputed(getter)
  trigger(target, 'cards')
  assert.equal(runs, 1, 'Paused and non-effect reads do not subscribe')
  removeEffects([render])
  assert.end()
})
