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
import Sprite from './Sprite.js'
import symbols from '../lib/symbols.js'
import { initLog } from '../lib/log.js'
import { stage, renderer } from '../launch.js'
import { renderer as engineRenderer } from '../engines/L3/launch.js'
import element from '../engines/L3/element.js'
import { EventEmitter } from 'node:events'

initLog()

stage.element = element
Object.assign(renderer, engineRenderer)
engineRenderer.createNode = () => new EventEmitter()

function createSprite() {
  const holder = element({ parent: { node: { width: 1920, height: 1080 } } }, {})
  holder.populate({})
  return Sprite()({}, holder)
}

test('Sprite - Type', (assert) => {
  assert.equal(typeof Sprite, 'function', 'Sprite should be a function')
  assert.equal(typeof Sprite(), 'function', 'Sprite() should return a function')
  assert.end()
})

test('Sprite - Initialization', (assert) => {
  const sprite = createSprite()
  const props = sprite[symbols.props]
  const state = sprite[symbols.state]

  assert.equal(props.image, undefined, 'image prop should be undefined initially')
  assert.equal(state.spriteTexture, null, 'spriteTexture should be null initially')
  assert.equal(state.currentSrc, null, 'currentSrc should be null initially')
  assert.end()
})

test('Sprite - Texture returns null for invalid inputs', (assert) => {
  const sprite = createSprite()

  sprite[symbols.props].image = undefined
  assert.equal(sprite.texture, null, 'texture should be null when image is undefined')

  sprite[symbols.props].image = null
  assert.equal(sprite.texture, null, 'texture should be null when image is null')

  sprite[symbols.props].image = 'test.png'
  const originalCreateTexture = renderer.createTexture
  delete renderer.createTexture
  assert.equal(
    sprite.texture,
    null,
    'texture should be null when renderer.createTexture is missing'
  )

  renderer.createTexture = originalCreateTexture
  assert.end()
})

test('Sprite - Texture creates and reuses ImageTexture', (assert) => {
  const mockTex = {}
  let calls = 0
  const original = renderer.createTexture
  try {
    renderer.createTexture = () => (calls++, mockTex)

    const sprite = createSprite()
    sprite[symbols.props].image = 'test.png'
    assert.ok(sprite.texture !== null, 'texture should not be null when image is set')
    assert.equal(
      sprite[symbols.state].currentSrc,
      'test.png',
      'currentSrc should be set to image path'
    )
    assert.equal(calls, 1, 'createTexture should be called once for first image')

    sprite[symbols.props].image = 'test2.png'
    sprite.texture
    assert.equal(calls, 2, 'createTexture should be called again when image changes')
  } finally {
    renderer.createTexture = original
  }
  assert.end()
})

test('Sprite - Texture creates SubTexture with map and frame', (assert) => {
  const imgTex = {}
  const subTex = {}
  let imgCalls = 0
  const original = renderer.createTexture
  try {
    renderer.createTexture = (type) => (type === 'ImageTexture' ? (imgCalls++, imgTex) : subTex)

    const sprite = createSprite()
    sprite[symbols.props].image = 'sheet.png'
    sprite.texture
    const baseTex = sprite[symbols.state].spriteTexture

    // map.frames, map.frame1, missing w/h, manual frame object
    const cases = [
      {
        map: { frames: { f1: { x: 10, y: 20, w: 50, h: 60 } }, defaults: { w: 100, h: 100 } },
        frame: 'f1',
      },
      { map: { f1: { x: 5, y: 10, w: 30, h: 40 } }, frame: 'f1' },
      {
        map: { frames: { f1: { x: 10, y: 20, w: 50 } }, defaults: { w: 100, h: 100 } },
        frame: 'f1',
      },
      { map: null, frame: { x: 15, y: 25, w: 35, h: 45 } },
    ]

    cases.forEach(({ map, frame }) => {
      sprite[symbols.props].map = map
      sprite[symbols.props].frame = frame
      assert.equal(
        sprite.texture,
        subTex,
        'texture should be SubTexture when map and frame are set'
      )
      assert.equal(
        sprite[symbols.state].currentSrc,
        'sheet.png',
        'currentSrc should remain unchanged'
      )
      assert.equal(imgCalls, 1, 'ImageTexture should be created only once')
      assert.equal(sprite[symbols.state].spriteTexture, baseTex, 'spriteTexture should be reused')
    })
  } finally {
    renderer.createTexture = original
  }
  assert.end()
})

test('Sprite - Texture returns spriteTexture when no frame', (assert) => {
  const mockTex = {}
  const mockSubTex = {}
  let subTexCalls = 0
  const original = renderer.createTexture
  try {
    renderer.createTexture = (type) => {
      if (type === 'ImageTexture') return mockTex
      if (type === 'SubTexture') {
        subTexCalls++
        return mockSubTex
      }
      return null
    }

    const sprite = createSprite()
    sprite[symbols.props].image = 'test.png'

    // Case 1: No frame used → must NOT create SubTexture
    sprite[symbols.props].map = null
    sprite[symbols.props].frame = null
    assert.ok(sprite.texture !== null, 'texture should not be null when no frame is set')
    assert.equal(subTexCalls, 0, 'should not create SubTexture when no frame')

    // Case 2: Invalid frame in map.frames → should NOT create SubTexture
    sprite[symbols.props].map = { frames: { f1: { x: 10, y: 20, w: 50, h: 60 } } }
    sprite[symbols.props].frame = 'nonexistent'
    sprite.texture // trigger computation
    assert.equal(
      subTexCalls,
      0,
      'should NOT create SubTexture for nonexistent frame in map.frames structure'
    )

    // Case 3: Invalid frame in direct map → should NOT create additional SubTexture
    sprite[symbols.props].map = { f1: { x: 10, y: 20, w: 50, h: 60 } }
    sprite[symbols.props].frame = 'nonexistent'
    const finalTexture = sprite.texture
    assert.ok(finalTexture !== null, 'texture should not be null')
    assert.equal(
      subTexCalls,
      0,
      'should NOT create additional SubTexture for nonexistent frame in direct map'
    )
  } finally {
    renderer.createTexture = original
  }
  assert.end()
})
