/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import test from 'tape'
import colors from './colors.js'

test('Object', (assert) => {
  const expected = 'object'
  const actual = typeof colors

  assert.equal(actual, expected, 'Colors should be an object')
  assert.end()
})

test('6 character hex', (assert) => {
  const input = ['#ffffff', '#000000', '#c0ffee', '#7dd3fc', '#0c4a6e']
  const expected = ['0xffffffff', '0xff000000', '0xffeeffc0', '0xfffcd37d', '0xff6e4a0c']

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 6 character hex code should return the correct color in abgr format'
  )
  assert.end()
})

test('3 character hex', (assert) => {
  const input = ['#fff', '#000', '#c8c']
  const expected = ['0xffffffff', '0xff000000', '0xffcc88cc']

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 3 character hex code should return the correct color in abgr format'
  )
  assert.end()
})

test('8 character hex (rgba)', (assert) => {
  const input = ['#ffffffff', '#000000ff', '#c0ffee80', '#7dd3fc10', '#0c4a6eff']
  const expected = ['0xffffffff', '0xff000000', '0x80eeffc0', '0x10fcd37d', '0xff6e4a0c']

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 8 character hex (rgba) code should return the correct color in abgr format'
  )
  assert.end()
})

test('RGB colors', (assert) => {
  const input = [
    'rgb(255,255,255)',
    'rgb(0,0,0)',
    'rgb(192, 255, 238)',
    'rgb(125, 211, 252)',
    'rgb(12, 74, 110)',
  ]
  const expected = ['0xffffffff', '0xff000000', '0xffeeffc0', '0xfffcd37d', '0xff6e4a0c']

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'RGB codes prefixed with # should return the correct color in abgr format'
  )
  assert.end()
})

test('RGBA colors', (assert) => {
  const input = [
    'rgb(255,255,255,1)',
    'rgb(0,0,0,1)',
    'rgb(192, 255, 238, 0.5)',
    'rgb(125, 211, 252, 0.1)',
    'rgb(12, 74, 110, 0)',
    'rgb(12, 74, 110, -0.5)', // negative alpha should become 0
    'rgb(12, 74, 110, 1.2)', // highher than 1 alpha should become 1
  ]
  const expected = [
    '0xffffffff',
    '0xff000000',
    '0x80eeffc0',
    '0x1afcd37d',
    '0x006e4a0c',
    '0x006e4a0c',
    '0xff6e4a0c',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'RGB codes prefixed with # should return the correct color in abgr format'
  )
  assert.end()
})

test('RGBA colors', (assert) => {
  const input = [
    'rgb(255,255,255,1)',
    'rgb(0,0,0,1)',
    'rgb(192, 255, 238, 0.5)',
    'rgb(125, 211, 252, 0.1)',
    'rgb(12, 74, 110, 0)',
    'rgb(12, 74, 110, -0.5)', // negative alpha should become 0
    'rgb(12, 74, 110, 1.2)', // highher than 1 alpha should become 1
  ]
  const expected = [
    '0xffffffff',
    '0xff000000',
    '0x80eeffc0',
    '0x1afcd37d',
    '0x006e4a0c',
    '0x006e4a0c',
    '0xff6e4a0c',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'RGB codes prefixed with # should return the correct color in abgr format'
  )
  assert.end()
})

test('HTML colors', (assert) => {
  const input = ['blanchedalmond', 'aqua', 'tomato', 'saddlebrown', 'red']

  const expected = [
    parseInt('0xffcdebff', 16),
    parseInt('0xffffff00', 16),
    parseInt('0xff4763ff', 16),
    parseInt('0xff13458b', 16),
    parseInt('0xff0000ff', 16),
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'RGB codes prefixed with # should return the correct color in abgr format'
  )
  assert.end()
})

// test('hsl', (assert) => {
//   const input = [
//     'hsl(0,0,100)',
//     'hsl(0,0, 0)',
//     'hsl(164,100,88)',
//     'hsl(199,95,74)',
//     'hsl(202,80,24)',
//   ]
//   const expected = ['0xffffffff', '0xff000000', '0xffeeffc0', '0xfffcd37d', '0xff6e4a0c']

//   const actual = input.map(colors.normalize)

//   assert.deepEqual(actual, expected, 'A hsl code should return the correct color in abgr format')
//   assert.end()
// })

// hls()
// hlsa()
// html color (red, blue, pink)
