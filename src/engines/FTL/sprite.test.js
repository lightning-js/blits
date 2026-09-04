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
import { resolveFrameOptions, spriteFrameKey, resolveSpriteTexture } from './sprite.js'

initLog()

const map = {
  defaults: { w: 160, h: 160 },
  frames: {
    icon1_focus: { x: 5, y: 5 },
    icon1_unfocus: { x: 175, y: 345 },
  },
}

test('sprite - resolveFrameOptions matrix (L3 parity)', (assert) => {
  assert.deepEqual(
    resolveFrameOptions(map, 'icon1_focus'),
    { w: 160, h: 160, x: 5, y: 5 },
    'frames map merges defaults'
  )
  assert.deepEqual(
    resolveFrameOptions({ icon2: { x: 1, y: 2 } }, 'icon2'),
    { x: 1, y: 2 },
    'flat map lookup'
  )
  assert.deepEqual(
    resolveFrameOptions(null, { x: 1, y: 2, w: 3, h: 4 }),
    { x: 1, y: 2, w: 3, h: 4 },
    'inline object frame without map'
  )
  assert.deepEqual(
    resolveFrameOptions(map, { x: 9, y: 9 }),
    { x: 9, y: 9 },
    'inline object frame with map'
  )
  assert.equal(resolveFrameOptions(map, 'missing'), null, 'unknown frame -> null')
  assert.equal(resolveFrameOptions(null, null), null, 'no map/frame -> null')
  assert.equal(resolveFrameOptions(map, undefined), null, 'no frame -> null')
  assert.end()
})

test('sprite - spriteFrameKey', (assert) => {
  assert.equal(spriteFrameKey('icon1'), 'icon1', 'string passes through')
  assert.equal(spriteFrameKey({ x: 1 }), JSON.stringify({ x: 1 }), 'object stringified')
  assert.equal(spriteFrameKey(undefined), undefined, 'undefined passes through')
  assert.end()
})

test('sprite - resolveSpriteTexture', (assert) => {
  const calls = []
  const fakeBase = { src: 'sheet.png' }
  const fakeSub = { base: true }
  const ftlApp = {
    createImage: (props) => {
      calls.push(['image', props])
      return fakeBase
    },
    createTexture: (type, props) => {
      calls.push([type, props])
      return fakeSub
    },
  }

  assert.equal(resolveSpriteTexture(null, { image: 'a.png' }), null, 'null app -> null')
  assert.equal(resolveSpriteTexture(ftlApp, {}), null, 'no image -> null')
  assert.equal(resolveSpriteTexture(ftlApp, { image: '' }), null, 'empty image -> null')

  const tex = resolveSpriteTexture(ftlApp, { image: 'sheet.png', map, frame: 'icon1_focus' })
  assert.equal(tex, fakeSub, 'returns subtexture for mapped frame')
  assert.deepEqual(
    calls,
    [
      ['image', { src: 'sheet.png' }],
      ['subtexture', { baseTexture: fakeBase, x: 5, y: 5, w: 160, h: 160 }],
    ],
    'base image then subtexture with merged frame rect'
  )

  calls.length = 0
  const plain = resolveSpriteTexture(ftlApp, { image: 'solo.png' })
  assert.equal(plain, fakeBase, 'no frame -> base image texture')
  assert.deepEqual(calls, [['image', { src: 'solo.png' }]], 'no subtexture created')
  assert.end()
})
