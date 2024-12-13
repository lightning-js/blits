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
import element from './element.js'
import { renderer } from './launch.js'
import { EventEmitter } from 'node:events'
import { initLog } from '../../lib/log.js'
import symbols from '../../lib/symbols.js'

initLog()

let elementRef

test('Type', (assert) => {
  assert.ok(element instanceof Function, 'Element should be a factory function')
  assert.end()
})

test('Destroy', (assert) => {
  const el = element({}, {})
  el.node = { destroy: () => {} }
  const capture = assert.capture(el.node, 'destroy')

  el.destroy()

  const calls = capture()
  assert.ok(calls.length > 0, 'Node destroy should be invoked')
  assert.end()
})

test('NodeId', (assert) => {
  const el = element({}, {})
  el.node = { id: 123 }

  const result = el.nodeId

  assert.equal(result, 123, 'NodeId should be correct')
  assert.end()
})

test('Ref', (assert) => {
  const el = element({}, {})
  el.props = { ref: 123 }

  const result = el.ref

  assert.equal(result, 123, 'Ref should be correct')
  assert.end()
})

test('Parent', (assert) => {
  const el = element({}, {})
  el.node = { parent: 'foo' }

  const result = el.parent

  assert.equal(result, 'foo', 'Parent should be correct')
  assert.end()
})

test('Children', (assert) => {
  const el = element({}, {})
  el.node = 'foo'
  el.component[symbols.getChildren] = () => [
    { id: 0, parent: 'bar' },
    { id: 1, parent: 'foo' },
    { id: 2, parent: undefined },
    { id: 3, parent: 0 },
    { id: 4, parent: 'foo' },
  ]

  const result = el.children

  assert.equal(result.length, 2, 'Children amount should be correct')
  assert.deepEqual(
    result.map((c) => c.id),
    [1, 4],
    'Children should be correct'
  )
  assert.end()
})

test('Element - Set `w` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('w', 100)

  assert.equal(el.node['width'], 100, 'Node width parameter should be set')
  assert.equal(el.props.props['width'], 100, 'Props width parameter should be set')
  assert.equal(el.props.raw['w'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `w` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('w', '50%')

  assert.equal(el.node['width'], 960, 'Node width parameter should be set to 960')
  assert.equal(el.props.props['width'], 960, 'Props width parameter should be set')
  assert.equal(el.props.raw['w'], '50%', "Props' raw map entry should be added")

  assert.end()
})

test('Element - Set `h` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('h', 100)

  assert.equal(el.node['height'], 100, 'Node height parameter should be set')
  assert.equal(el.props.props['height'], 100, 'Props height parameter should be set')
  assert.equal(el.props.raw['h'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `h` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('h', '50%')

  assert.equal(el.node['height'], 540, 'Node width parameter should be set to 540')
  assert.equal(el.props.props['height'], 540, 'Props width parameter should be set')
  assert.equal(el.props.raw['h'], '50%', "Props' raw map entry should be added")

  assert.end()
})

test('Element - Set `x` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('x', 100)

  assert.equal(el.node['x'], 100, 'Node x parameter should be set')
  assert.equal(el.props.props['x'], 100, 'Props x parameter should be set')
  assert.equal(el.props.raw['x'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `x` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('x', '50%')

  assert.equal(el.node['x'], 960, 'Node x parameter should be set to 960')
  assert.equal(el.props.props['x'], 960, 'Props x parameter should be set')
  assert.equal(el.props.raw['x'], '50%', "Props' raw map entry should be added")

  assert.end()
})

test('Element - Set `y` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('y', 100)

  assert.equal(el.node['y'], 100, 'Node y parameter should be set')
  assert.equal(el.props.props['y'], 100, 'Props y parameter should be set')
  assert.equal(el.props.raw['y'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `y` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('y', '50%')

  assert.equal(el.node['y'], 540, 'Node y parameter should be set to 540')
  assert.equal(el.props.props['y'], 540, 'Props y parameter should be set')
  assert.equal(el.props.raw['y'], '50%', "Props' raw map entry should be added")

  assert.end()
})

test('Element - Set `mount` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()
  const value = '{ x: 10, y: 20 }'

  el.set('mount', value)

  assert.equal(el.node['mountX'], 10, 'Node mountX parameter should be set')
  assert.equal(el.node['mountY'], 20, 'Node mountY parameter should be set')
  assert.equal(el.props.props['mountX'], 10, 'Props mountX parameter should be set')
  assert.equal(el.props.props['mountY'], 20, 'Props mountY parameter should be set')
  assert.equal(el.props.raw['mount'], value, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `color` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('color', 'azure')

  assert.equal(el.node['color'], '0xf0ffffff', 'Node color parameter should be set')
  assert.equal(el.props.props['color'], '0xf0ffffff', 'Props color parameter should be set')
  assert.equal(el.props.raw['color'], 'azure', "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `src` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()
  const value = 'file://foo.html'

  el.set('src', value)

  assert.equal(el.node['src'], value, 'Node src parameter should be set')
  assert.equal(el.props.props['src'], value, 'Props src parameter should be set')
  assert.equal(el.props.raw['src'], value, "Props' raw map entry should be added")
  assert.equal(el.props.props['color'], 0xffffffff, 'Props default color parameter should be set')
  assert.end()
})

test('Element - Set `texture` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('texture', 'foo')

  assert.equal(el.node['texture'], 'foo', 'Node texture parameter should be set')
  assert.equal(el.props.props['texture'], 'foo', 'Props texture parameter should be set')
  assert.equal(el.props.raw['texture'], 'foo', "Props' raw map entry should be added")
  assert.equal(el.props.props['color'], 0xffffffff, 'Props default color parameter should be set')
  assert.end()
})

test('Element - Set `fit` property with a string type value', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  const fitVal = 'contain'
  el.set('fit', fitVal)

  assert.ok(el.node['textureOptions'] instanceof Object, 'textureOptions should be an object')
  assert.ok(
    el.node['textureOptions']['resizeMode'] instanceof Object,
    'resizeMode should be an object'
  )
  assert.equal(
    el.node['textureOptions']['resizeMode']['type'],
    fitVal,
    'Node resizeMode "type" parameter should be set'
  )
  assert.equal(
    el.props.props['textureOptions']['resizeMode']['type'],
    fitVal,
    'Props textureOptions parameter should be set'
  )
  assert.equal(el.props.raw['fit'], fitVal, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `fit` property with an object type value', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  const fitVal = "{type: 'cover', position: {x: 0, y:1}}"
  el.set('fit', fitVal)

  assert.equal(
    el.node['textureOptions']['resizeMode']['type'],
    'cover',
    'Node resizeMode "type" parameter should be set'
  )
  assert.equal(
    el.props.props['textureOptions']['resizeMode']['type'],
    'cover',
    'Props textureOptions parameter should be set'
  )
  assert.equal(
    el.node['textureOptions']['resizeMode']['clipX'],
    0,
    'Node resizeMode "clipX" parameter should be set to correct value'
  )
  assert.equal(
    el.node['textureOptions']['resizeMode']['clipY'],
    1,
    'Node resizeMode "clipY" parameter should be set to correct value'
  )
  assert.equal(el.props.raw['fit'], fitVal, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `fit` property with position key as a string type value', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  const fitVal = "{type: 'cover', position: 1}"
  el.set('fit', fitVal)

  assert.equal(
    el.node['textureOptions']['resizeMode']['type'],
    'cover',
    'Node resizeMode "type" parameter should be set'
  )
  assert.equal(
    el.props.props['textureOptions']['resizeMode']['type'],
    'cover',
    'Props textureOptions parameter should be set'
  )
  assert.equal(
    el.node['textureOptions']['resizeMode']['clipX'],
    1,
    'Node resizeMode "clipX" parameter should be set to correct value'
  )
  assert.equal(
    el.node['textureOptions']['resizeMode']['clipY'],
    1,
    'Node resizeMode "clipY" parameter should be set to correct value'
  )
  assert.equal(el.props.raw['fit'], fitVal, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `fit` property should not set not required keys', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  const fitVal = "{type: 'cover', dummy1: 0, dummy2: 0}"
  el.set('fit', fitVal)

  assert.equal(
    el.node['textureOptions']['resizeMode']['type'],
    'cover',
    'Node resizeMode "type" parameter should be set'
  )
  assert.equal(
    el.props.props['textureOptions']['resizeMode']['dummy1'],
    undefined,
    'Props resizeMode "dummy1" parameter should not be set'
  )
  assert.equal(
    el.props.props['textureOptions']['resizeMode']['dummy2'],
    undefined,
    'Props resizeMode "dummy2" parameter should not be set'
  )
  assert.end()
})

test('Element - Set `placement` property with value `center`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', 'center')

  assert.equal(el.node['mountX'], 0.5, 'Node mountX parameter should set to 0.5')
  assert.equal(el.props.props['mountX'], 0.5, 'Props mountX parameter should set to 0.5')
  assert.equal(el.node['x'], 960, 'Node x parameter should set to half of parent node width, 960')
  assert.equal(el.props.props['x'], 960, 'props x parameter should be set to 960')
  assert.equal(
    el.node['y'],
    undefined,
    'Node Y parameter should not be modified from default value'
  )

  assert.end()
})

test('Element - Set `placement` property with value `right`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', 'right')

  assert.equal(el.node['mountX'], 1, 'Node mountX parameter should set to 1')
  assert.equal(el.props.props['mountX'], 1, 'Props mountX parameter should set to 1')
  assert.equal(el.node['x'], 1920, 'Node x parameter should set to parent node full width, 1920')
  assert.equal(el.props.props['x'], 1920, 'props x parameter should be set to 1920')
  assert.equal(
    el.node['y'],
    undefined,
    'Node Y parameter should not be modified from default value'
  )

  assert.end()
})

test('Element - Set `placement` property with value `middle`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', 'middle')

  assert.equal(el.node['mountY'], 0.5, 'Node mountY parameter should set to 0.5')
  assert.equal(el.props.props['mountY'], 0.5, 'Props mountY parameter should set to 0.5')
  assert.equal(el.node['y'], 540, 'Node Y parameter should set to half of parent node height, 540')
  assert.equal(el.props.props['y'], 540, 'props Y parameter should be set to 540')
  assert.equal(
    el.node['x'],
    undefined,
    'Node X parameter should not be modified from default value'
  )

  assert.end()
})

test('Element - Set `placement` property with value `bottom`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', 'bottom')

  assert.equal(el.node['mountY'], 1, 'Node mountY parameter should set to 1')
  assert.equal(el.props.props['mountY'], 1, 'Props mountY parameter should set to 1')
  assert.equal(el.node['y'], 1080, 'Node Y parameter should set to parent node full height, 1080')
  assert.equal(el.props.props['y'], 1080, 'props Y parameter should be set to 1080')
  assert.equal(
    el.node['x'],
    undefined,
    'Node X parameter should not be modified from default value'
  )

  assert.end()
})

test('Element - Set `placement` property with value `bottom` & x = 300', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', 'bottom')

  assert.equal(el.node['mountY'], 1, 'Node mountY parameter should set to 1')
  assert.equal(el.props.props['mountY'], 1, 'Props mountY parameter should set to 1')
  assert.equal(el.node['y'], 1080, 'Node Y parameter should set to parent node full height, 1080')
  assert.equal(el.props.props['y'], 1080, 'props Y parameter should be set to 1080')

  el.set('x', 300)

  assert.equal(el.node['x'], 300, 'Node x parameter should set custom value 300')

  assert.end()
})

test('Element - Set `placement` property with object value `{x:"center", y:"middle"}`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', "{x:'center', y:'middle'}")

  assert.equal(el.node['mountX'], 0.5, 'Node mountX parameter should set to 0.5')
  assert.equal(el.props.props['mountX'], 0.5, 'Props mountX parameter should set to 0.5')
  assert.equal(el.node['x'], 960, 'Node x parameter should set to half of parent node width, 960')

  assert.equal(el.node['mountY'], 0.5, 'Node mountY parameter should set to 0.5')
  assert.equal(el.props.props['mountY'], 0.5, 'Props mountY parameter should set to 0.5')
  assert.equal(el.node['y'], 540, 'Node Y parameter should set to half of parent node height, 540')

  assert.end()
})

test('Element - Set `placement` property with object value `{x:"center", y:"bottom"}`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', "{x:'center', y:'bottom'}")

  assert.equal(el.node['mountX'], 0.5, 'Node mountX parameter should set to 0.5')
  assert.equal(el.props.props['mountX'], 0.5, 'Props mountX parameter should set to 0.5')
  assert.equal(el.node['x'], 960, 'Node x parameter should set to half of parent node width, 960')

  assert.equal(el.node['mountY'], 1, 'Node mountY parameter should set to 1')
  assert.equal(el.props.props['mountY'], 1, 'Props mountY parameter should set to 1')
  assert.equal(el.node['y'], 1080, 'Node Y parameter should set to parent node full height , 1080')

  assert.end()
})

test('Element - Set `placement` property with object value `{x:"right", y:"middle"}`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', "{x:'right', y:'middle'}")

  assert.equal(el.node['mountX'], 1, 'Node mountX parameter should set to 1')
  assert.equal(el.props.props['mountX'], 1, 'Props mountX parameter should set to 1')
  assert.equal(el.node['x'], 1920, 'Node x parameter should set to parent node full width, 1920')

  assert.equal(el.node['mountY'], 0.5, 'Node mountY parameter should set to 0.5')
  assert.equal(el.props.props['mountY'], 0.5, 'Props mountY parameter should set to 0.5')
  assert.equal(el.node['y'], 540, 'Node Y parameter should set to half of parent node height, 540')

  assert.end()
})

test('Element - Set `placement` property with object value `{x:"right", y:"bottom"}`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('placement', "{x:'right', y:'bottom'}")

  assert.equal(el.node['mountX'], 1, 'Node mountX parameter should set to 1')
  assert.equal(el.props.props['mountX'], 1, 'Props mountX parameter should set to 1')
  assert.equal(el.node['x'], 1920, 'Node x parameter should set to parent node full width, 1920')

  assert.equal(el.node['mountY'], 1, 'Node mountY parameter should set to 1')
  assert.equal(el.props.props['mountY'], 1, 'Props mountY parameter should set to 1')
  assert.equal(el.node['y'], 1080, 'Node Y parameter should set to parent node height, 1080')

  assert.end()
})

test('Element - Set `float` property with value `unknown`', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('float', 'unknown')

  assert.equal(el.node['mountX'], undefined, 'Node mountX parameter should not be changed')
  assert.equal(el.props.props['mountX'], undefined, 'Props mountX parameter should not be changed')
  assert.equal(el.node['x'], undefined, 'Node x parameter should not get updated')
  assert.equal(el.props.props['x'], undefined, 'props x parameter should not be changed')

  assert.end()
})

test('Element - Set `show` property as false', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('w', 960)
  el.set('h', 540)

  el.set('show', false)

  elementRef = el

  assert.equal(el.node['alpha'], 0, 'Node alpha parameter should set to 0')
  assert.equal(el.props.props['alpha'], 0, 'Props alpha parameter should set')
  assert.equal(el.node['width'], 0, 'Node width parameter should set to 0')
  assert.equal(el.props.props['width'], 0, 'props width parameter should set to 0')
  assert.equal(el.node['height'], 0, 'Node height parameter should set to 0')
  assert.equal(el.props.props['height'], 0, 'props height parameter should set to 0')

  assert.end()
})

test('Element - Set `show` property as false', (assert) => {
  const el = elementRef

  el.set('show', true)

  assert.equal(el.node['alpha'], 1, 'Node alpha parameter should be set')
  assert.equal(el.props.props['alpha'], 1, 'Props alpha parameter should be set')
  assert.equal(el.node['width'], 960, 'Node width parameter should be set')
  assert.equal(el.props.props['width'], 960, 'props width parameter should be set')
  assert.equal(el.node['height'], 540, 'Node height parameter should be set')
  assert.equal(el.props.props['height'], 540, 'props height parameter should be set')

  assert.end()
})

function createElement() {
  const el = element({ parent: { node: { width: 1920, height: 1080 } } }, {})
  el.populate({
    parent: {
      node: new EventEmitter(),
    },
  })
  return el
}
