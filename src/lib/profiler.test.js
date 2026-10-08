/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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
import profiler, { profile, profileBegin, profileEnd } from './profiler.js'

test('Profiler - disabled by default', (assert) => {
  assert.equal(profiler.enabled, false, 'profiler should be disabled')
  assert.equal(profileBegin(), 0, 'profileBegin should return 0 when disabled')

  profileEnd('disabled', 0)
  assert.deepEqual(profiler.snapshot(), {}, 'no measurements should be recorded')
  assert.end()
})

test('Profiler - records measurements when started', (assert) => {
  profiler.start()
  assert.equal(profiler.enabled, true, 'profiler should be enabled')

  profileEnd('render', profileBegin())
  profileEnd('render', profileBegin())
  profileEnd('update', profileBegin())

  const result = profiler.stop()

  assert.equal(profiler.enabled, false, 'profiler should be disabled after stop')
  assert.deepEqual(Object.keys(result).sort(), ['render', 'update'], 'should record both labels')
  assert.equal(result.render.calls, 2, 'render should be recorded twice')
  assert.equal(result.update.calls, 1, 'update should be recorded once')
  assert.equal(
    result.render.averageMs,
    result.render.totalMs / 2,
    'average should be total divided by the number of calls'
  )
  assert.ok(result.render.maxMs <= result.render.totalMs, 'max should not exceed the total')
  assert.end()
})

test('Profiler - named marks record measurements', (assert) => {
  profiler.start()

  profiler.mark('render')
  profiler.mark('render')
  profiler.markEnd('render')
  profiler.markEnd('render')
  profiler.markEnd('missing')

  const result = profiler.stop()
  assert.equal(result.render.calls, 2, 'should record both marks with the same name')
  assert.equal(result.missing, undefined, 'an unmatched mark end should be ignored')
  assert.end()
})

test('Profiler - named marks do not record when disabled', (assert) => {
  profiler.reset()
  profiler.mark('disabled')
  profiler.markEnd('disabled')

  assert.deepEqual(profiler.snapshot(), {}, 'no measurements should be recorded')
  assert.end()
})

test('Profiler - start clears previous measurements', (assert) => {
  profiler.start()
  profileEnd('first', profileBegin())
  profiler.start()

  assert.deepEqual(profiler.snapshot(), {}, 'previous measurements should be cleared')

  profileEnd('second', profileBegin())
  profiler.reset()
  assert.deepEqual(profiler.snapshot(), {}, 'reset should clear measurements')
  assert.equal(profiler.enabled, true, 'reset should not change the enabled state')

  profiler.stop()
  assert.end()
})

test('Profiler - profile() wraps a function', (assert) => {
  profiler.start()

  const result = profile('calculate', () => 42)
  assert.equal(result, 42, 'should return the result of the wrapped function')
  assert.equal(profiler.snapshot().calculate.calls, 1, 'should record a measurement')

  assert.throws(
    () =>
      profile('failing', () => {
        throw new Error('oops')
      }),
    /oops/,
    'should rethrow errors from the wrapped function'
  )
  assert.equal(profiler.snapshot().failing.calls, 1, 'should record a measurement when throwing')

  profiler.stop()

  assert.equal(
    profile('ignored', () => 'value'),
    'value',
    'should pass through when disabled'
  )
  assert.equal(profiler.snapshot().ignored, undefined, 'should not record when disabled')
  assert.end()
})
