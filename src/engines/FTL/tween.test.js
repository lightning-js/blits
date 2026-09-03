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
import { initLog } from '../../lib/log.js'
import { setAnimationEngine, resolveEasing, createTween, hasRunningTweens } from './tween.js'

initLog()

/**
 * Minimal AnimeJS stand-in: captures params, exposes manual triggers.
 * Mirrors the subset Blits uses: animate(proxy, params) with
 * {duration, delay, ease, autoplay, onBegin, onUpdate, onComplete},
 * plus play/cancel/complete on the returned handle.
 */
const createMockEngine = () => {
  const calls = []
  const cubicBezierCalls = []
  return {
    calls,
    cubicBezierCalls,
    engine: { update: () => {} },
    animate: (proxy, params) => {
      const handle = {
        proxy,
        params,
        played: false,
        cancelled: false,
        completed: false,
        play() {
          this.played = true
        },
        cancel() {
          this.cancelled = true
        },
        complete() {
          this.completed = true
          // emulate AnimeJS complete(): snap + onComplete
          if (params.onComplete) params.onComplete()
        },
      }
      calls.push(handle)
      return handle
    },
    cubicBezier: (a, b, c, d) => {
      cubicBezierCalls.push([a, b, c, d])
      return `cubicBezier(${a},${b},${c},${d})`
    },
  }
}

const mockNode = () => {
  let dirtied = 0
  return {
    x: 0,
    dirty() {
      dirtied++
    },
    get dirtied() {
      return dirtied
    },
  }
}

test('tween - easing map matches L3 cubic-bezier parameters', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)

  assert.equal(
    resolveEasing('ease-out-back'),
    'cubicBezier(0.34,1.56,0.64,1)',
    'ease-out-back maps to L3 parameters'
  )
  assert.equal(resolveEasing('ease'), 'cubicBezier(0.25,0.1,0.25,1)', 'default ease maps')
  assert.equal(
    resolveEasing('ease-in-out-back'),
    'cubicBezier(0.68,-0.6,0.32,1.6)',
    'ease-in-out-back maps'
  )
  assert.equal(
    resolveEasing(undefined),
    'cubicBezier(0.25,0.1,0.25,1)',
    'undefined defaults to ease'
  )
  assert.equal(
    resolveEasing('cubic-bezier(1,-0.64,0.39,1.44)'),
    'cubicBezier(1,-0.64,0.39,1.44)',
    'custom cubic-bezier passes through'
  )
  assert.equal(resolveEasing('nonsense'), 'linear', 'unknown easing falls back to linear')
  assert.end()
})

test('tween - lifecycle: start, tick writes, complete', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()
  const written = []

  const tween = createTween(node, 'x', 0, 100, { duration: 300, easing: 'ease-out' }, (v) =>
    written.push(v)
  )
  assert.equal(tween.state, 'scheduled', 'starts scheduled')
  assert.equal(hasRunningTweens(), false, 'no running tweens before start')

  tween.start()
  assert.equal(tween.state, 'running', 'running after start')
  assert.equal(hasRunningTweens(), true, 'counter incremented')
  assert.equal(node.dirtied, 1, 'start dirties once to wake the loop')
  assert.equal(mock.calls.length, 1, 'one anime call')
  assert.equal(mock.calls[0].params.duration, 300, 'duration passed through')
  assert.equal(mock.calls[0].params.delay, 0, 'delay defaults to 0')
  assert.equal(
    mock.calls[0].params.ease,
    'cubicBezier(0,0,0.58,1)',
    'ease-out maps to L3 parameters'
  )
  assert.equal(mock.calls[0].played, true, 'autoplay off, explicit play')

  // drive frames manually
  mock.calls[0].proxy.v = 50
  mock.calls[0].params.onUpdate({ progress: 0.5 })
  assert.deepEqual(written, [50], 'onUpdate writes eased value')
  mock.calls[0].params.onBegin()
  mock.calls[0].params.onComplete()
  assert.deepEqual(written, [50, 100], 'onComplete writes exact end value')
  assert.equal(tween.state, 'stopped', 'stopped after complete')
  assert.equal(hasRunningTweens(), false, 'counter decremented')
  assert.end()
})

test('tween - once/on events and progress payload', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()

  const tween = createTween(node, 'x', 0, 10, {}, () => {})
  const events = []
  tween.once('animating', () => events.push('animating'))
  tween.on('tick', (n, { progress }) => events.push(`tick:${progress}`))
  tween.once('stopped', () => events.push('stopped'))

  tween.start()
  const handle = mock.calls[0]
  handle.params.onBegin()
  handle.params.onBegin() // once: second fire is a no-op for `once`
  handle.proxy.v = 5
  handle.params.onUpdate({ progress: 0.5 })
  handle.params.onComplete()

  assert.deepEqual(
    events,
    ['animating', 'tick:0.5', 'stopped'],
    'once fires once, tick carries progress'
  )
  assert.end()
})

test('tween - stop(false) cancels without end', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()
  const written = []

  const tween = createTween(node, 'x', 0, 100, {}, (v) => written.push(v))
  let stopped = 0
  tween.once('stopped', () => stopped++)
  tween.start()
  const handle = mock.calls[0]
  tween.stop(false)

  assert.equal(tween.state, 'stopped', 'stopped state')
  assert.equal(handle.cancelled, true, 'anime cancelled')
  assert.equal(stopped, 0, 'stopped event not fired on cancel')
  assert.equal(tween.canceled, true, 'canceled flag set')
  assert.equal(hasRunningTweens(), false, 'counter decremented')
  assert.deepEqual(written, [], 'no end value written on cancel')
  assert.end()
})

test('tween - stop(true) finishes early with end', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()
  const written = []

  const tween = createTween(node, 'x', 0, 100, {}, (v) => written.push(v))
  let stopped = 0
  tween.once('stopped', () => stopped++)
  tween.start()
  tween.stop(true)

  assert.equal(tween.state, 'stopped', 'stopped state')
  assert.equal(stopped, 1, 'stopped event fired on finish-early')
  assert.ok(written.indexOf(100) !== -1, 'end value written')
  assert.equal(hasRunningTweens(), false, 'counter decremented')
  assert.end()
})

test('tween - stop before start never touches the counter', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()

  const tween = createTween(node, 'x', 0, 100, {}, () => {})
  tween.stop(false)
  assert.equal(tween.state, 'stopped', 'stopped state')
  assert.equal(hasRunningTweens(), false, 'counter untouched')
  assert.equal(mock.calls.length, 0, 'no anime instance created')

  const tween2 = createTween(node, 'x', 0, 100, {}, () => {})
  let stopped = 0
  tween2.once('stopped', () => stopped++)
  tween2.stop(true)
  assert.equal(stopped, 1, 'stop(true) before start snaps + fires stopped')
  assert.end()
})

test('tween - array values tween per channel (color)', (assert) => {
  const mock = createMockEngine()
  setAnimationEngine(mock)
  const node = mockNode()
  const written = []

  const tween = createTween(node, 'color', [0, 0, 0, 1], [1, 1, 1, 1], {}, (v) => written.push(v))
  tween.start()
  const handle = mock.calls[0]
  assert.equal(handle.proxy.c0, 0, 'proxy channel 0 starts at from')
  assert.equal(handle.params.c3, 1, 'proxy target channel 3 is to')
  handle.proxy.c0 = 0.5
  handle.proxy.c1 = 0.5
  handle.proxy.c2 = 0.5
  handle.proxy.c3 = 1
  handle.params.onUpdate({ progress: 0.5 })
  assert.deepEqual(written, [[0.5, 0.5, 0.5, 1]], 'array write per channel')
  handle.params.onComplete()
  assert.deepEqual(written[1], [1, 1, 1, 1], 'onComplete writes exact end array (no float residue)')
  assert.end()
})

test('tween - start without engine throws loud error', (assert) => {
  setAnimationEngine(null)
  const node = mockNode()
  const tween = createTween(node, 'x', 0, 100, {}, () => {})
  assert.throws(() => tween.start(), /animation engine not loaded/, 'loud error without engine')
  assert.end()
})
