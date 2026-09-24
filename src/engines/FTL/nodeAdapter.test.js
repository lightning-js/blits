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
