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
import colors from './colors.js'

test('Object', (assert) => {
  const expected = 'object'
  const actual = typeof colors

  assert.equal(actual, expected, 'Colors should be an object')
  assert.end()
})

test('6 character hex', (assert) => {
  const input = [
    '#ffffff',
    '#000000',
    '#c0ffee',
    '#7dd3fc',
    '#0c4a6e',
    'ffffff',
    '000000',
    'c0ffee',
    '7dd3fc',
    '0c4a6e',
  ]
  const expected = [
    '0xffffffff',
    '0x000000ff',
    '0xc0ffeeff',
    '0x7dd3fcff',
    '0x0c4a6eff',
    '0xffffffff',
    '0x000000ff',
    '0xc0ffeeff',
    '0x7dd3fcff',
    '0x0c4a6eff',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 6 character hex code should return the correct color in rgba format'
  )
  assert.end()
})

test('3 character hex', (assert) => {
  const input = ['#fff', '#000', '#c8c', 'fff', '000', 'c8c']
  const expected = [
    '0xffffffff',
    '0x000000ff',
    '0xcc88ccff',
    '0xffffffff',
    '0x000000ff',
    '0xcc88ccff',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 3 character hex code should return the correct color in rgba format'
  )
  assert.end()
})

test('8 character hex (rgba)', (assert) => {
  const input = [
    '#ffffffff',
    '#000000ff',
    '#c0ffee80',
    '#7dd3fc10',
    '#0c4a6eff',
    'ffffffff',
    '000000ff',
    'c0ffee80',
    '7dd3fc10',
    '0c4a6eff',
  ]
  const expected = [
    '0xffffffff',
    '0x000000ff',
    '0xc0ffee80',
    '0x7dd3fc10',
    '0x0c4a6eff',
    '0xffffffff',
    '0x000000ff',
    '0xc0ffee80',
    '0x7dd3fc10',
    '0x0c4a6eff',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'A 8 character hex (rgba) code should return the correct color in rgba format'
  )
  assert.end()
})

test('Invalid hex values', (assert) => {
  const input = [
    '#fde4',
    '#1000',
    '#ddc8c',
    'hg0',
    '000fffa',
    '#a',
    '#0',
    'c8O',
    'fffff',
    '000f00000',
    '##000000',
  ]
  const expected = [
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
  ]

  const actual = input.map((color) => colors.normalize(color))

  assert.deepEqual(
    actual,
    expected,
    'Invalid hex values should return white color as the default color'
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
  const expected = ['0xffffffff', '0x000000ff', '0xc0ffeeff', '0x7dd3fcff', '0x0c4a6eff']

  const actual = input.map(colors.normalize)

  assert.deepEqual(actual, expected, 'RGB codes should return the correct color in rgba format')
  assert.end()
})

test('Invalid RGB colors', (assert) => {
  const input = [
    'rgb(256,255,255)',
    'rgb(123,432,211)',
    'rgb(192, 255)',
    'rgb(125,, 211, 252)',
    'rgb(-12, 74, 110)',
  ]
  const expected = ['0xffffffff', '0xffffffff', '0xffffffff', '0xffffffff', '0xffffffff']

  const actual = input.map((color) => colors.normalize(color))

  assert.deepEqual(actual, expected, 'Invalid RGB codes should return white color in rgba format')
  assert.end()
})

test('RGBA colors', (assert) => {
  const input = [
    'rgba(255,255,255,1)',
    'rgba(0,0,0,1)',
    'rgba(192, 255, 238, 0.5)',
    'rgba(125, 211, 252, 0.1)',
    'rgba(12, 74, 110, 0)',
    'rgba(12, 74, 110, -0.5)', // negative alpha should become 0
    'rgba(12, 74, 110, 1.2)', // highher than 1 alpha should become 1
  ]
  const expected = [
    '0xffffffff',
    '0x000000ff',
    '0xc0ffee80',
    '0x7dd3fc1a',
    '0x0c4a6e00',
    '0x0c4a6e00',
    '0x0c4a6eff',
  ]

  const actual = input.map(colors.normalize)

  assert.deepEqual(actual, expected, 'RGBA codes should return the correct color in rgba format')
  assert.end()
})

test('Invalid RGBA colors', (assert) => {
  const input = [
    'rgb(255,255,255,1)',
    'rgba(0,0,0,a)',
    'rgba(192, 256, 238, 0.5)',
    'rgba(125, 252, 0.1)',
    'rgba(12,, 74, 110, 0)',
    'rgba(-12, 74, 110, -0.5)',
    'rgba(12, 74, 110, --1.2)',
  ]
  const expected = [
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
    '0xffffffff',
  ]

  const actual = input.map((color) => colors.normalize(color))

  assert.deepEqual(actual, expected, 'Invalid RGBA codes should return white color in rgba format')
  assert.end()
})

test('HTML colors', (assert) => {
  const input = ['blanchedalmond', 'salmon', 'tomato', 'saddlebrown', 'red']
  const expected = ['0xffebcdff', '0xfa8072ff', '0xff6347ff', '0x8b4513ff', '0xff0000ff']

  const actual = input.map(colors.normalize)

  assert.deepEqual(
    actual,
    expected,
    'HTML color codes should return the correct color in rgba format'
  )
  assert.end()
})

test('Invalid HTML colors', (assert) => {
  const input = ['darkblanchedalmond', 'selmon', 'lighttomato', 'sadlebrown', 'darkbrown']
  const expected = ['0xffffffff', '0xffffffff', '0xffffffff', '0xffffffff', '0xffffffff']

  const actual = input.map((color) => colors.normalize(color))

  assert.deepEqual(
    actual,
    expected,
    'Invalid HTML color codes should return white color in rgba format'
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

//   assert.deepEqual(actual, expected, 'A hsl code should return the correct color in rgba format')
//   assert.end()
// })

// hls()
// hlsa()
// html color (red, blue, pink)
