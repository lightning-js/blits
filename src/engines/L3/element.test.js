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
import sinon from 'sinon'
import shaders from '../../lib/shaders/shaders.js' // Changed from './shaderLoader.js'

initLog()

// Mock renderer.createShader to prevent "is not a function" errors
// Returns a shader object with the type passed as first argument
if (!renderer.createShader) {
  renderer.createShader = (type, props) => ({ type, ...(props || {}) })
}

// Mock renderer.createTextNode if it doesn't exist
if (!renderer.createTextNode) {
  renderer.createTextNode = () => new EventEmitter()
}

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

  assert.equal(el.node['w'], 100, 'Node w parameter should be set')
  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  assert.equal(el.props.raw['w'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `w` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('w', '50%')

  assert.equal(el.node['w'], 960, 'Node w parameter should be set to 960')
  assert.equal(el.props.props['w'], 960, 'Props w parameter should be set')
  assert.equal(el.props.raw['w'], '50%', "Props' raw map entry should be added")

  assert.end()
})

test('Element - Set `h` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('h', 100)

  assert.equal(el.node['h'], 100, 'Node h parameter should be set')
  assert.equal(el.props.props['h'], 100, 'Props h parameter should be set')
  assert.equal(el.props.raw['h'], 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element- Set `h` property in percentage', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('h', '50%')

  assert.equal(el.node['h'], 540, 'Node h parameter should be set to 540')
  assert.equal(el.props.props['h'], 540, 'Props h parameter should be set')
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
  assert.equal(
    el.node['x'],
    960,
    'Node x parameter should set to half of parent node width (w), 960'
  )
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
  assert.equal(
    el.node['x'],
    1920,
    'Node x parameter should set to parent node full width (w), 1920'
  )
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
  assert.equal(
    el.node['x'],
    960,
    'Node x parameter should set to half of parent node width (w), 960'
  )

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
  assert.equal(
    el.node['x'],
    960,
    'Node x parameter should set to half of parent node width (w), 960'
  )

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
  assert.equal(
    el.node['x'],
    1920,
    'Node x parameter should set to parent node full width (w), 1920'
  )

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
  assert.equal(
    el.node['x'],
    1920,
    'Node x parameter should set to parent node full width (w), 1920'
  )

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

  assert.end()
})

test('Element - Set `show` property as false', (assert) => {
  const el = elementRef

  el.set('show', true)

  assert.equal(el.node['alpha'], 1, 'Node alpha parameter should be set')
  assert.equal(el.props.props['alpha'], 1, 'Props alpha parameter should be set')
  assert.equal(el.node['w'], 960, 'Node w parameter should be set')
  assert.equal(el.node['h'], 540, 'Node h parameter should be set')

  assert.end()
})

test('Element - Set `w` property through transition', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()

  el.set('w', { transition: { value: 100 } })

  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  assert.end()
})

test('Element - Listen to transition start callback on `w` prop changes', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const startSpy = sinon.spy()
  const el = createElement()

  el.set('w', { transition: { value: 100, start: startSpy } })

  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  setTimeout(() => {
    assert.ok(startSpy.calledOnce, 'Transition start callback should be called once')
    assert.equal(
      startSpy.getCall(0).args.length,
      3,
      'Transition start callback should be called with three arguments'
    )
    assert.equal(
      startSpy.getCall(0).args[0],
      el,
      'Transition start callback first argument should be element itself'
    )
    assert.equal(
      startSpy.getCall(0).args[1],
      'w',
      'Transition start callback second argument should be `w` property'
    )
    assert.equal(
      startSpy.getCall(0).args[2],
      0,
      'Transition start callback third argument value should be an initial value of `0`'
    )
    assert.end()
  }, 100)
})

test('Element - Cancel transition running on same prop `W` ', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()

  el.set('w', { transition: { value: 50 } })
  el.set('w', { transition: { value: 100 } })

  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  assert.end()
})

test('Element - Layout with horizontal direction layout use cases', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())

  const CHILD_1_WIDTH = 500
  const CHILD_2_WIDTH = 250
  const CHILD_HEIGHT = 0
  const GAP = 30

  const layoutUpdateSpy = sinon.spy()

  const layoutEl = createLayoutElement('horizontal', GAP, layoutUpdateSpy)

  // Creating two elements which will be children to parentEl
  const child1 = element({ parent: layoutEl }, {})
  const child2 = element({ parent: layoutEl }, {})

  // To bind layout function to each children
  child1.populate({})
  child2.populate({})

  // Adding children element nodes to layout Element node
  layoutEl.node.children.push(child1.node)
  layoutEl.node.children.push(child2.node)

  // Initial width, x, y, height of each element is, 0
  // Setting child1 width to 500, should effect child 2 X position
  child1.set('w', CHILD_1_WIDTH)

  assert.equal(child1.node['w'], CHILD_1_WIDTH, 'Child 1 Node w parameter should be set')
  assert.equal(child1.props.props['w'], CHILD_1_WIDTH, 'Child 1 Props w parameter should be set')
  assert.equal(
    child2.node['x'],
    CHILD_1_WIDTH + GAP,
    'Child 2 Node X parameter should be layout gap + child 1 w'
  )

  assert.equal(layoutUpdateSpy.callCount, 3, 'Layout updated callback should be called 3 times')
  assert.equal(
    layoutUpdateSpy.getCall(0).args.length,
    2,
    'Layout updated callback should be called with 2 arguments'
  )
  assert.equal(
    layoutUpdateSpy.getCall(2).args[0].w,
    CHILD_1_WIDTH,
    'Layout w should be equal to Child1 w'
  )
  assert.equal(
    layoutUpdateSpy.getCall(2).args[0].h,
    CHILD_HEIGHT,
    'Layout height should be equal to Child1 or Child 2 height'
  )

  child2.set('w', CHILD_2_WIDTH)
  assert.equal(child2.node['w'], CHILD_2_WIDTH, 'Child 2 Node w parameter should be set')
  assert.equal(child2.props.props['w'], CHILD_2_WIDTH, 'Child 2 Props w parameter should be set')
  assert.equal(layoutUpdateSpy.callCount, 4, 'Layout updated callback call count should be 4')
  assert.equal(
    layoutUpdateSpy.getCall(3).args[0].w,
    CHILD_1_WIDTH + GAP + CHILD_2_WIDTH,
    'Layout w should be equal to Child1 w + gap + Child2 w'
  )
  assert.equal(
    layoutUpdateSpy.getCall(3).args[0].h,
    CHILD_HEIGHT,
    'Layout height should be equal to Child1 or Child 2 height'
  )

  assert.end()
})

test('Element - Layout with vertical direction use case', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())

  const CHILD_1_HEIGHT = 500
  const CHILD_2_HEIGHT = 250
  const CHILD_WIDTH = 0
  const GAP = 30

  const layoutUpdateSpy = sinon.spy()

  const layoutEl = createLayoutElement('vertical', GAP, layoutUpdateSpy)

  // Creating two elements which will be children to parentEl
  const child1 = element({ parent: layoutEl }, {})
  const child2 = element({ parent: layoutEl }, {})

  // To bind layout function to each children
  child1.populate({})
  child2.populate({})

  // Adding children element nodes to layout Element node
  layoutEl.node.children.push(child1.node)
  layoutEl.node.children.push(child2.node)

  // Initial w, x, y, height of each element is, 0
  // Setting Child1 height to 500, should effect Child 2 Y position
  child1.set('h', CHILD_1_HEIGHT)

  assert.equal(child1.node['h'], CHILD_1_HEIGHT, 'Child 1 Node height parameter should be set')
  assert.equal(
    child1.props.props['h'],
    CHILD_1_HEIGHT,
    'Child 1 Props height parameter should be set'
  )
  assert.equal(
    child2.node['y'],
    CHILD_1_HEIGHT + GAP,
    'Child 2 Node y parameter should be layout gap + Child 1 height'
  )

  assert.equal(layoutUpdateSpy.callCount, 3, 'Layout updated callback should be called 3 times')
  assert.equal(
    layoutUpdateSpy.getCall(0).args.length,
    2,
    'Layout updated callback should be called with 2 arguments'
  )
  assert.equal(
    layoutUpdateSpy.getCall(2).args[0].h,
    CHILD_1_HEIGHT,
    'Layout height should be equal to Child1 height'
  )
  assert.equal(
    layoutUpdateSpy.getCall(2).args[0].w,
    CHILD_WIDTH,
    'Layout w should be equal to Child1 or Child 2 w'
  )

  child2.set('h', CHILD_2_HEIGHT)
  assert.equal(child2.node['h'], CHILD_2_HEIGHT, 'Child 2 Node height parameter should be set')
  assert.equal(child2.props.props['h'], CHILD_2_HEIGHT, 'Child 2 Props h parameter should be set')
  assert.equal(layoutUpdateSpy.callCount, 4, 'Layout updated callback call count should be 4')
  assert.equal(
    layoutUpdateSpy.getCall(3).args[0].h,
    CHILD_1_HEIGHT + GAP + CHILD_2_HEIGHT,
    'Layout height should be equal to Child1 height + gap + Child2 height'
  )
  assert.equal(
    layoutUpdateSpy.getCall(3).args[0].w,
    CHILD_WIDTH,
    'Layout w should be equal to Child1 or Child 2 w'
  )

  assert.end()
})

test('Element - Create Text Node', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  const title = 'Welcome to Blits'

  el.set('content', title)

  assert.equal(el.node['text'], title, 'Node text parameter should be set')
  assert.equal(el.props.props['text'], title, 'Props text parameter should be set')
  assert.equal(el.props.raw['content'], title, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Create Text Node with supported props', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  const title = 'Welcome to Blits'

  el.set('content', title)
  assert.equal(el.node['text'], title, 'Node text parameter should be set')
  assert.equal(el.props.props['text'], title, 'Props text parameter should be set')

  el.set('textoverflow', true)
  assert.equal(el.node['overflowSuffix'], undefined, 'Node textoverflow parameter should be set')
  assert.equal(
    el.props.props['textoverflow'],
    undefined,
    'Props textoverflow parameter should be set'
  )

  el.set('letterspacing', 10)
  assert.equal(el.node['letterSpacing'], 10, 'Node letterSpacing parameter should be set')
  assert.equal(el.props.props['letterSpacing'], 10, 'Props letterSpacing parameter should be set')

  el.set('lineheight', 20)
  assert.equal(el.node['lineHeight'], 20, 'Node lineHeight parameter should be set')
  assert.equal(el.props.props['lineHeight'], 20, 'Props lineHeight parameter should be set')

  assert.end()
})

test('Element - Create Text Node with supported props 2', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  const title = 'Welcome to Blits'

  el.set('content', title)

  el.set('maxheight', 35)

  el.set('maxlines', 2)
  assert.equal(el.node['maxLines'], 2, 'Node maxLines parameter should be set')
  assert.equal(el.props.props['maxLines'], 2, 'Props maxLines parameter should be set')

  el.set('align', 'center')
  assert.equal(el.node['textAlign'], 'center', 'Node textAlign parameter should be set')
  assert.equal(el.props.props['textAlign'], 'center', 'Props textAlign parameter should be set')

  assert.end()
})

test((assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  const title = 'Welcome to Blits'

  el.set('content', title)

  el.set('maxwidth', 500)

  el.set('clipping', true)
  assert.equal(el.node['clipping'], true, 'Node clipping parameter should be set')
  assert.equal(el.props.props['clipping'], true, 'Props clipping parameter should be set')

  el.set('overflow', true)
  assert.equal(el.node['clipping'], false, 'overflow attribute should set node clipping parameter')
  assert.equal(el.props.props['clipping'], false, 'Props clipping parameter should be set')

  assert.end()
})

test('Element - Transition an element property with progress callback', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())

  const el = createElement()

  const progSpy = sinon.spy()

  el.set('w', { transition: { value: 100, progress: progSpy } })

  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  // assert.equal(progSpy.callCount, 10, 'Transition progress callback should be called 10 times')
  assert.end()
})

test('Element - Transition an element property with end callback', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()

  const endSpy = sinon.spy()

  el.set('w', { transition: { value: 100, end: endSpy } })

  assert.equal(el.props.props['w'], 100, 'Props w parameter should be set')
  // assert.ok(endSpy.calledOnce, 'Transition end callback should be called only once')
  assert.end()
})

test('Element - Destroy created Element node', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  el.set('w', { transition: { value: 100, duration: 4000 } })
  el.destroy()
  assert.equal(el.node, null, 'Node should set to null')
  assert.equal(el.component, undefined, 'Component should be deleted from element')
  assert.equal(el.props, undefined, 'Props should be deleted from element')
  assert.equal(el.config, undefined, 'Config should be deleted from element')
  assert.equal(el.triggerLayout, undefined, 'TriggerLayout should be deleted from element')
  assert.end()
})

test('Element - Element with error callback', (assert) => {
  const customNode = new CustomNode()
  assert.capture(renderer, 'createNode', () => customNode)

  const errSpy = sinon.spy()

  const el = createElement({
    props: {
      '@error': errSpy,
    },
  })

  assert.equal(el.props['@error'], errSpy, 'Props @error parameter should be set')
  assert.equal(el.props.raw['@error'], errSpy, "Prop's raw map entry should be added")
  customNode.fail()
  assert.ok(errSpy.calledOnce, 'error callback should be called once')
  assert.end()
})

test('Element - Element with loaded callback', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())

  const loadedFun = () => {}
  const el = createElement({
    props: {
      '@loaded': loadedFun,
    },
  })
  assert.equal(el.props['@loaded'], loadedFun, 'Props @loaded parameter should be set')
  assert.equal(el.props.raw['@loaded'], loadedFun, "Prop's raw map entry should be added")

  assert.end()
})

class CustomAnimator extends EventEmitter {
  constructor(node, props, transObj) {
    super()
    this.node = node
    this.props = props
    this.transObj = transObj
    this.state = 'init'
  }

  start() {
    this.state = 'scheduled'
    this.emit('animating')

    let elapsed = 0
    const tickInterval = this.transObj.duration / 10
    const propsKeys = Object.keys(this.props)
    const valueChunk = this.props[propsKeys[0]] / 10
    let valueCounter = 0
    const tickTimer = setInterval(() => {
      elapsed += tickInterval
      valueCounter++
      this.emit('tick', {}, { progress: valueChunk * valueCounter })
      if (elapsed >= this.transObj.duration) {
        clearInterval(tickTimer)
        this.node[propsKeys[0]] = this.props[propsKeys[0]]
        this.emit('stopped')
      }
    }, tickInterval)
  }
  stop() {
    this.state = 'stopped'
  }
}

class CustomNode extends EventEmitter {
  constructor() {
    super()
    // setting initial props of renderer node
    this.w = 0
    this.x = 0
    this.h = 0
    this.y = 0

    // setting children to empty []
    this.children = []

    const loadedTimeout = setTimeout(() => {
      this.emit('loaded', this, { type: '', dimensions: { w: 100, h: 100 } })
      clearTimeout(loadedTimeout)
    }, 0)
  }

  animate(props, transObj) {
    const animationEmitter = new CustomAnimator(this, props, transObj)
    return animationEmitter
  }

  destroy() {}
  fail() {
    this.emit('failed')
  }

  addChildren(el) {
    this.children.push(el)
  }
}

function createElement(props = {}) {
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  const data = {
    parent: {
      node: new EventEmitter(),
    },
  }
  if (Object.keys(props).length !== 0) {
    const propsKeys = Object.keys(props.props)
    for (let i = 0; i < propsKeys.length; i++) {
      data[propsKeys[i]] = props.props[propsKeys[i]]
    }
  }

  el.populate(data)
  return el
}

function createLayoutElement(direction, gap, layoutUpdateSpy) {
  let layoutElNode

  // creating component object to fake children
  const comp = {
    [symbols.getChildren]: () => {
      return [
        {
          props: { raw: { show: true } },
          parent: layoutElNode,
        },
        {
          props: { raw: { show: true } },
          parent: layoutElNode,
        },
      ]
    },
  }

  // element to break chain of parent element layoutFn trigger
  const grandParent = element({ parent: new EventEmitter(), props: {} }, {})

  // Layout Element
  const layoutEl = element({ parent: grandParent }, comp)

  // Populating layout element with configuration
  layoutEl.populate({ __layout: true, direction: direction, gap: gap, '@updated': layoutUpdateSpy })
  layoutElNode = layoutEl.node

  return layoutEl
}

// Test for lines 522-524: isSlot symbol handling
test('Element - Set isSlot symbol', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  const props = {}
  props[symbols.isSlot] = true
  el.populate({ parent: { node: new EventEmitter() }, ...props })
  assert.equal(el[symbols.isSlot], true, 'isSlot should be set')
  assert.end()
})

// Tests for lines 544-546: ElementShader creation
test('Element - ElementShader with shadow', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  el.populate({ parent: { node: new EventEmitter() }, shadow: { blur: 10 } })
  assert.equal(el.props.elementShader, true, 'elementShader should be true')
  assert.end()
})

test('Element - ElementShader with rounded', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  el.populate({ parent: { node: new EventEmitter() }, rounded: 10 })
  assert.equal(el.props.elementShader, true, 'elementShader should be true')
  assert.end()
})

test('Element - ElementShader with border', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  el.populate({ parent: { node: new EventEmitter() }, border: { width: 2 } })
  assert.equal(el.props.elementShader, true, 'elementShader should be true')
  assert.end()
})

// Test for line 620: Multiple properties without transitions
test('Element - Set mount with object (multiple props)', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  el.set('mount', { x: 0.5, y: 0.75 })
  assert.equal(el.node['mountX'], 0.5, 'mountX should be set')
  assert.equal(el.node['mountY'], 0.75, 'mountY should be set')
  assert.end()
})

// Test for lines 683-686: Transition with layout parent
test('Element - Transition with layout parent', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const layoutSpy = sinon.spy()
  const layoutEl = createLayoutElement('horizontal', 10, layoutSpy)
  const childEl = element({ parent: layoutEl }, {})
  childEl.populate({ parent: layoutEl })
  layoutEl.node.children.push(childEl.node)
  childEl.set('w', { transition: { value: 100, duration: 50 } })
  setTimeout(() => {
    assert.ok(layoutSpy.callCount > 3, 'Layout should be triggered on ticks')
    assert.end()
  }, 80)
})

// Tests for lines 691-692, 697-702: Progress callback and transition end
test('Element - Transition progress callback', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  const progressSpy = sinon.spy()
  el.set('w', { transition: { value: 100, duration: 50, progress: progressSpy } })
  setTimeout(() => {
    assert.ok(progressSpy.callCount >= 1, 'Progress should be called at least once')
    assert.end()
  }, 100)
})

test('Element - Transition end when node undefined', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  const endSpy = sinon.spy()
  el.set('w', { transition: { value: 100, duration: 100, end: endSpy } })
  setTimeout(() => {
    el.node = undefined
  }, 20)
  setTimeout(() => {
    assert.notOk(endSpy.called, 'End should not be called')
    assert.end()
  }, 200)
})

test('Element - Transition canceled', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  const endSpy = sinon.spy()
  el.set('w', { transition: { value: 100, duration: 2000, end: endSpy } })
  setTimeout(() => {
    el.set('w', { transition: { value: 200, duration: 30 } })
  }, 20)
  setTimeout(() => {
    assert.notOk(endSpy.called, 'Canceled end should not be called')
    assert.end()
  }, 150)
})

// Additional tests for text properties to increase coverage
test('Element - Set font property', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  el.set('font', 'Arial')
  assert.equal(el.props.props['fontFamily'], 'Arial', 'font should set fontFamily')
  assert.end()
})

test('Element - Set size property', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  el.set('size', 24)
  assert.equal(el.props.props['fontSize'], 24, 'size should set fontSize')
  assert.end()
})

test('Element - Set maxwidth property', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  el.set('maxwidth', 500)
  assert.equal(el.props.props['maxWidth'], 500, 'maxwidth should set maxWidth')
  assert.equal(el.props.props['contain'], 'width', 'maxwidth should set contain')
  assert.end()
})

test('Element - ElementShader assignment (line 544)', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const shaderCapture = assert.capture(shaders, 'createElementShader', () => ({ type: 'shader' }))
  const el = element({ parent: { node: { w: 1920, h: 1080 } } }, {})
  el.populate({ parent: { node: new EventEmitter() }, shadow: { blur: 5 } })
  assert.ok(shaderCapture()[0], 'createElementShader should be called')
  assert.equal(el.props.elementShader, true, 'elementShader should be set to true')
  assert.equal(el.props.props['shader'].type, 'shader', 'shader should be assigned')
  assert.end()
})

test('Element - Multiple properties loop with transition (line 620)', (assert) => {
  assert.capture(renderer, 'createNode', () => new CustomNode())
  const el = createElement()
  el.set('mount', { x: { transition: { value: 0.5, duration: 50 } }, y: 0.75 })
  setTimeout(() => {
    assert.ok(el.node['mountX'] !== undefined, 'mountX should be set')
    assert.equal(el.node['mountY'], 0.75, 'mountY should be set')
    assert.end()
  }, 100)
})

test('Element - Set maxheight property', (assert) => {
  assert.capture(renderer, 'createTextNode', () => new EventEmitter())
  const el = createElement({ props: { __textnode: true } })
  el.set('maxheight', 300)
  assert.equal(el.props.props['contain'], 'height', 'maxheight should set contain to height')
  assert.end()
})
