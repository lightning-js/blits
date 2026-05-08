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
import { resolveSpriteTexture } from './spriteTexture.js'
import { renderer } from '../../launch.js'
import { renderer as engineRenderer } from './launch.js'

Object.assign(renderer, engineRenderer)
const testRenderer = /** @type {any} */ (renderer)

/**
 * Minimal test element shape used by resolveSpriteTexture.
 * @param {Record<string, any>} raw
 * @returns {any}
 */
function el(raw) {
  return { props: { raw } }
}

test('resolveSpriteTexture - returns null for missing image or renderer support', (assert) => {
  const state = { spriteTexture: null, currentSrc: null }

  assert.equal(resolveSpriteTexture(el({ image: undefined }), testRenderer, state), null)
  assert.equal(resolveSpriteTexture(el({ image: null }), testRenderer, state), null)

  const originalCreateTexture = testRenderer.createTexture
  delete testRenderer.createTexture
  assert.equal(resolveSpriteTexture(el({ image: 'x.png' }), testRenderer, state), null)
  testRenderer.createTexture = originalCreateTexture

  assert.end()
})

test('resolveSpriteTexture - creates ImageTexture and reuses it for same src', (assert) => {
  const mockTex = {}
  let calls = 0
  const original = testRenderer.createTexture
  try {
    testRenderer.createTexture = () => (calls++, mockTex)
    const state = { spriteTexture: null, currentSrc: null }

    const first = resolveSpriteTexture(el({ image: 'test.png' }), testRenderer, state)
    const second = resolveSpriteTexture(el({ image: 'test.png' }), testRenderer, state)

    assert.equal(first, mockTex)
    assert.equal(second, mockTex)
    assert.equal(state.currentSrc, 'test.png')
    assert.equal(calls, 1)
  } finally {
    testRenderer.createTexture = original
  }
  assert.end()
})

test('resolveSpriteTexture - recreates ImageTexture when src changes', (assert) => {
  const tex1 = {}
  const tex2 = {}
  let calls = 0
  const original = testRenderer.createTexture
  try {
    testRenderer.createTexture = () => {
      calls++
      return calls === 1 ? tex1 : tex2
    }
    const state = { spriteTexture: null, currentSrc: null }

    assert.equal(resolveSpriteTexture(el({ image: 'a.png' }), testRenderer, state), tex1)
    assert.equal(resolveSpriteTexture(el({ image: 'b.png' }), testRenderer, state), tex2)
    assert.equal(calls, 2)
    assert.equal(state.currentSrc, 'b.png')
  } finally {
    testRenderer.createTexture = original
  }
  assert.end()
})

test('resolveSpriteTexture - creates SubTexture from map.frames and defaults', (assert) => {
  const imgTex = {}
  const subTex = {}
  const subTextureCalls = []
  const original = testRenderer.createTexture
  try {
    testRenderer.createTexture = (type, options) => {
      if (type === 'ImageTexture') return imgTex
      if (type === 'SubTexture') {
        subTextureCalls.push(options)
        return subTex
      }
      return null
    }

    const raw = {
      image: 'sheet.png',
      map: { frames: { f1: { x: 10, y: 20, w: 50 } }, defaults: { w: 100, h: 200 } },
      frame: 'f1',
    }
    const state = { spriteTexture: null, currentSrc: null }
    const out = resolveSpriteTexture(el(raw), testRenderer, state)

    assert.equal(out, subTex)
    assert.equal(subTextureCalls.length, 1)
    assert.equal(subTextureCalls[0].texture, imgTex)
    assert.equal(subTextureCalls[0].x, 10)
    assert.equal(subTextureCalls[0].y, 20)
    assert.equal(subTextureCalls[0].w, 50)
    assert.equal(subTextureCalls[0].h, 200)
  } finally {
    testRenderer.createTexture = original
  }
  assert.end()
})

test('resolveSpriteTexture - creates SubTexture from direct map and manual frame object', (assert) => {
  const baseTex = {}
  const subTex = {}
  let subTexCalls = 0
  const original = testRenderer.createTexture
  try {
    testRenderer.createTexture = (type) => {
      if (type === 'ImageTexture') return baseTex
      if (type === 'SubTexture') {
        subTexCalls++
        return subTex
      }
      return null
    }

    const raw = /** @type {any} */ ({
      image: 'test.png',
      map: { f1: { x: 1, y: 2, w: 3, h: 4 } },
      frame: 'f1',
    })
    const state = { spriteTexture: null, currentSrc: null }

    assert.equal(resolveSpriteTexture(el(raw), testRenderer, state), subTex)
    assert.equal(subTexCalls, 1)

    raw.map = null
    raw.frame = { x: 5, y: 6, w: 7, h: 8 }
    assert.equal(resolveSpriteTexture(el(raw), testRenderer, state), subTex)
    assert.equal(subTexCalls, 2)
  } finally {
    testRenderer.createTexture = original
  }
  assert.end()
})

test('resolveSpriteTexture - returns base texture when frame cannot be resolved', (assert) => {
  const baseTex = {}
  let subTexCalls = 0
  const original = testRenderer.createTexture
  try {
    testRenderer.createTexture = (type) => {
      if (type === 'ImageTexture') return baseTex
      if (type === 'SubTexture') {
        subTexCalls++
        return {}
      }
      return null
    }

    const raw = {
      image: 'test.png',
      map: { frames: { f1: { x: 10, y: 20, w: 50, h: 60 } } },
      frame: 'missing',
    }
    const state = { spriteTexture: null, currentSrc: null }
    const out = resolveSpriteTexture(el(raw), testRenderer, state)

    assert.equal(out, baseTex)
    assert.equal(subTexCalls, 0)
  } finally {
    testRenderer.createTexture = original
  }
  assert.end()
})
