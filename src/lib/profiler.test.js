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
import { initLog } from './log.js'
import Settings from '../settings.js'

const fakeRenderer = () => {
  let handler
  return {
    on(event, callback) {
      if (event === 'frameTick') handler = callback
    },
    off(event, callback) {
      if (event === 'frameTick' && handler === callback) handler = undefined
    },
    frame(time, delta) {
      handler(this, { time, delta })
    },
  }
}

test('Profiler - rejects measurements from outside the current session', (assert) => {
  const disabled = profileBegin()
  profiler.start()
  profileEnd('disabled', disabled)
  const previous = profileBegin()
  profiler.start()
  profileEnd('previous', previous)
  const stopped = profileBegin()
  profiler.stop()
  profileEnd('stopped', stopped)
  profiler.start()
  profileEnd('restarted', stopped)
  assert.deepEqual(profiler.stop().measurements, {}, 'only current-session spans may be recorded')
  assert.end()
})

test('Profiler - reset invalidates pending spans and preserves enabled state', (assert) => {
  profiler.start()
  const pending = profileBegin()
  profiler.mark('named')
  profiler.mark('named')
  profile('recorded', () => 42)
  profiler.reset()
  profileEnd('pending', pending)
  profiler.markEnd('named')
  profiler.markEnd('named')
  assert.equal(profiler.enabled, true)
  assert.deepEqual(
    profiler.snapshot().measurements,
    {},
    'reset clears results and all pending spans'
  )
  profileEnd('fresh', profileBegin())
  assert.equal(profiler.stop().measurements.fresh.calls, 1, 'new spans still record')
  profiler.reset()
  assert.equal(profiler.enabled, false, 'reset does not enable a stopped profiler')
  assert.end()
})

test('Profiler - wrappers cannot record across session boundaries', (assert) => {
  for (const changeSession of [() => profiler.start(), () => profiler.reset()]) {
    profiler.start()
    assert.equal(
      profile('stale', () => {
        changeSession()
        return 42
      }),
      42
    )
    assert.deepEqual(profiler.stop().measurements, {}, 'finally ignores a stale session token')
  }
  assert.end()
})

test('Profiler - disabled by default', (assert) => {
  assert.equal(profiler.enabled, false, 'profiler should be disabled')
  assert.equal(profileBegin(), 0, 'profileBegin should return 0 when disabled')

  profileEnd('disabled', 0)
  assert.deepEqual(profiler.snapshot().measurements, {}, 'no measurements should be recorded')
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
  assert.deepEqual(
    Object.keys(result.measurements).sort(),
    ['render', 'update'],
    'should record both labels'
  )
  assert.equal(result.measurements.render.calls, 2, 'render should be recorded twice')
  assert.equal(result.measurements.update.calls, 1, 'update should be recorded once')
  assert.equal(
    result.measurements.render.averageMs,
    result.measurements.render.totalMs / 2,
    'average should be total divided by the number of calls'
  )
  assert.ok(
    result.measurements.render.maxMs <= result.measurements.render.totalMs,
    'max should not exceed the total'
  )
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
  assert.equal(result.measurements.render.calls, 2, 'should record both marks with the same name')
  assert.equal(result.measurements.missing, undefined, 'an unmatched mark end should be ignored')
  assert.end()
})

test('Profiler - named marks do not record when disabled', (assert) => {
  profiler.reset()
  profiler.mark('disabled')
  profiler.markEnd('disabled')

  assert.deepEqual(profiler.snapshot().measurements, {}, 'no measurements should be recorded')
  assert.end()
})

test('Profiler - start clears previous measurements', (assert) => {
  profiler.start()
  profileEnd('first', profileBegin())
  profiler.start()

  assert.deepEqual(profiler.snapshot().measurements, {}, 'previous measurements should be cleared')

  profileEnd('second', profileBegin())
  profiler.reset()
  assert.deepEqual(profiler.snapshot().measurements, {}, 'reset should clear measurements')
  assert.equal(profiler.enabled, true, 'reset should not change the enabled state')

  profiler.stop()
  assert.end()
})

test('Profiler - profile() wraps a function', (assert) => {
  profiler.start()

  const result = profile('calculate', () => 42)
  assert.equal(result, 42, 'should return the result of the wrapped function')
  assert.equal(profiler.snapshot().measurements.calculate.calls, 1, 'should record a measurement')

  assert.throws(
    () =>
      profile('failing', () => {
        throw new Error('oops')
      }),
    /oops/,
    'should rethrow errors from the wrapped function'
  )
  assert.equal(
    profiler.snapshot().measurements.failing.calls,
    1,
    'should record a measurement when throwing'
  )

  profiler.stop()

  assert.equal(
    profile('ignored', () => 'value'),
    'value',
    'should pass through when disabled'
  )
  assert.equal(
    profiler.snapshot().measurements.ignored,
    undefined,
    'should not record when disabled'
  )
  assert.end()
})

test('Profiler - frame analysis records bounded complete frames', (assert) => {
  const renderer = fakeRenderer()
  profiler.setRenderer(renderer)
  profiler.start({ frames: true, maxFrames: 2, targetFps: 60 })
  renderer.frame(100, 16)
  profile('outer', () => profile('inner', () => 42))
  renderer.frame(120, 20)
  profileEnd('work', profileBegin())
  renderer.frame(150, 30)
  profileEnd('work', profileBegin())
  renderer.frame(190, 40)

  const frames = profiler.frameSnapshot()
  assert.equal(frames.frameCount, 2, 'keeps only the configured number of complete frames')
  assert.equal(frames.frameInterval.maxMs, 30, 'uses renderer frame intervals')
  assert.equal(frames.labels.work.calls, 2, 'attributes spans to frames')
  assert.equal(frames.slowFramePercent, 50, 'counts intervals over 1.5 target frame times')
  assert.equal(frames.slowestFrames.length, 2, 'keeps expensive frame attribution for inspection')
  const table = console.table
  const info = console.info
  const tables = []
  const titles = []
  Settings.set('debugLevel', 1)
  initLog()
  console.table = (value) => tables.push(value)
  console.info = (...args) => titles.push(args.at(-1))
  const result = profiler.report()
  console.table = table
  console.info = info
  assert.equal(result.frames.frameCount, 2, 'includes frames in the combined snapshot')
  assert.equal(
    result.measurements.work.calls,
    2,
    'includes marker measurements in the combined snapshot'
  )
  assert.equal(tables.length, 4, 'prints summary, markers, frame labels, and slow frames')
  assert.match(
    tables[3]['#1'].labels,
    /work: \d+\.\d{2} ms \(1 call\)/,
    'shows each expensive frame label contribution'
  )
  assert.deepEqual(
    titles,
    [
      'Profiler summary',
      'Profiler: all marker timings',
      'Profiler: marker timings within retained frames',
      'Profiler: most expensive retained frames',
    ],
    'labels each report table'
  )
  profiler.stop()
  profiler.setRenderer(undefined)
  assert.end()
})
