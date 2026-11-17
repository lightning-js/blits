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
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'tape'
import { initLog } from '../../lib/log.js'
import adapter from './nodeAdapter.js'

initLog()

/**
 * Minimal FTL element stand-in: records dirty()/dirtyBranch() calls and
 * behaves like the real node for the props setProp touches.
 */
const makeNode = (overrides = {}) => {
  const calls = { dirty: 0, dirtyBranch: 0 }
  const node = {
    rtt: false,
    rttGroupId: null,
    dirty() {
      calls.dirty++
    },
    dirtyBranch() {
      calls.dirtyBranch++
    },
    ...overrides,
  }
  return { node, calls }
}

test('setProp dirties the node for every prop', (t) => {
  for (const key of ['x', 'scaleX', 'alpha', 'color', 'w', 'visible']) {
    const { node, calls } = makeNode()
    adapter.setProp(node, key, 1)
    t.equal(calls.dirty, 1, `${key} calls dirty() once`)
    t.equal(node[key], 1, `${key} is assigned`)
  }
  t.end()
})

test('setProp branches the subtree for inherited state', (t) => {
  for (const key of ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'alpha', 'visible', 'zIndex']) {
    const { node, calls } = makeNode()
    adapter.setProp(node, key, 1)
    t.equal(calls.dirtyBranch, 1, `${key} walks descendants`)
  }
  t.end()
})

test('setProp skips the subtree walk for color (no child-visible state)', (t) => {
  const { node, calls } = makeNode({ color: [1, 1, 1, 1] })
  adapter.setProp(node, 'color', [0, 0, 0, 1])
  t.equal(calls.dirty, 1, 'node itself is still dirtied')
  t.equal(calls.dirtyBranch, 0, 'descendants are not walked')
  t.end()
})

test('setProp skips the subtree walk for w/h on plain containers', (t) => {
  for (const key of ['w', 'h']) {
    const { node, calls } = makeNode()
    adapter.setProp(node, key, 100)
    t.equal(calls.dirty, 1, `${key} dirties the node`)
    t.equal(calls.dirtyBranch, 0, `${key} skips the walk`)
  }
  t.end()
})

test('setProp still branches w/h on RTT roots (framebuffer resize)', (t) => {
  for (const key of ['w', 'h']) {
    const { node, calls } = makeNode({ rtt: true, rttGroupId: null })
    adapter.setProp(node, key, 100)
    t.equal(calls.dirtyBranch, 1, `RTT root ${key} walks members so the framebuffer re-renders`)
  }
  t.end()
})

test('setProp still branches w/h for RTT members', (t) => {
  const { node, calls } = makeNode({ rtt: true, rttGroupId: 7 })
  adapter.setProp(node, 'w', 100)
  t.equal(calls.dirtyBranch, 0, 'member w skips the walk (member dirty marks the root)')
  t.end()
})

test('setProp routes text/texture through their setters without branching', (t) => {
  const { node, calls } = makeNode()
  let textSet = null
  Object.defineProperty(node, 'text', {
    get() {
      return node._text
    },
    set(v) {
      textSet = v
    },
  })
  adapter.setProp(node, 'text', { foo: 1 })
  t.deepEqual(textSet, { foo: 1 }, 'text assigned via setter')
  t.equal(calls.dirtyBranch, 0, 'text path skips the walk')

  let textureSet = null
  Object.defineProperty(node, 'texture', {
    get() {
      return node._texture
    },
    set(v) {
      textureSet = v
    },
  })
  adapter.setProp(node, 'texture', { bar: 2 })
  t.deepEqual(textureSet, { bar: 2 }, 'texture assigned via setter')
  t.equal(calls.dirtyBranch, 0, 'texture path skips the walk')
  t.end()
})

const makeSignal = () => {
  const listeners = new Set()
  return {
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    fire(value) {
      for (const cb of listeners) cb(value)
    },
    listeners,
  }
}

test('resource listeners follow texture replacements, not bounds transitions', (t) => {
  const first = { signals: { loaded: makeSignal() } }
  const second = { signals: { loaded: makeSignal() } }
  const { node } = makeNode({ w: 100, h: 50, texture: first })
  const loaded = []
  const unsubscribe = adapter.on(node, 'loaded', (data) => loaded.push(data))

  first.signals.loaded.fire(first)
  adapter.setProp(node, 'texture', second)
  first.signals.loaded.fire(first)
  second.signals.loaded.fire(second)

  t.equal(loaded.length, 2, 'only the current texture emits loaded')
  t.deepEqual(loaded[1], { w: 100, h: 50, type: 'texture' }, 'dimensions include resource type')
  t.equal(first.signals.loaded.listeners.size, 0, 'old texture listener removed')
  unsubscribe()
  t.equal(second.signals.loaded.listeners.size, 0, 'current texture listener removed')
  t.end()
})

test('warm texture notifications can be canceled before deferred delivery', async (t) => {
  const texture = { isReady: true, signals: { loaded: makeSignal() } }
  const { node } = makeNode({ w: 10, h: 20, texture })
  let calls = 0
  const unsubscribe = adapter.on(node, 'loaded', () => calls++)
  t.equal(calls, 0, 'loaded is never delivered inline during construction')
  unsubscribe()
  await Promise.resolve()
  t.equal(calls, 0, 'unsubscribe cancels the queued notification')
  t.end()
})

test('glyph text uses measured dimensions and stable element failure signals', (t) => {
  const signals = { textCalculated: makeSignal(), failed: makeSignal(), outOfBounds: makeSignal() }
  const { node } = makeNode({ w: 40, h: 30, text: { type: 1 }, texture: null, signals })
  let dimensions
  let failure
  let previous
  const unsubs = [
    adapter.on(node, 'loaded', (data) => {
      dimensions = data
    }),
    adapter.on(node, 'failed', (error) => {
      failure = error
    }),
    adapter.on(node, 'outOfBounds', (_node, data) => {
      previous = data.previous
    }),
  ]
  signals.textCalculated.fire({ w: 40, h: 30 })
  const error = new Error('font load failed')
  signals.failed.fire(error)
  signals.outOfBounds.fire(node)

  t.deepEqual(dimensions, { w: 40, h: 30, type: 'text' }, 'text reports measured dimensions')
  t.equal(failure, error, 'failure does not depend on a texture existing')
  t.equal(previous, 1, 'bounds payload supports the Blits detach hook')
  for (const unsubscribe of unsubs) unsubscribe()
  t.end()
})
