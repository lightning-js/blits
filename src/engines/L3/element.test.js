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
  assert.equal(el.props.raw.get('w'), 100, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `mount` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()
  const value = { x: 10, y: 20 }

  el.set('mount', value)

  assert.equal(el.node['mountX'], 10, 'Node mountX parameter should be set')
  assert.equal(el.node['mountY'], 20, 'Node mountY parameter should be set')
  assert.equal(el.props.props['mountX'], 10, 'Props mountX parameter should be set')
  assert.equal(el.props.props['mountY'], 20, 'Props mountY parameter should be set')
  assert.equal(el.props.raw.get('mount'), value, "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `color` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('color', 'azure')

  assert.equal(el.node['color'], '0xf0ffffff', 'Node color parameter should be set')
  assert.equal(el.props.props['color'], '0xf0ffffff', 'Props color parameter should be set')
  assert.equal(el.props.raw.get('color'), 'azure', "Props' raw map entry should be added")
  assert.end()
})

test('Element - Set `src` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()
  const value = 'file://foo.html'

  el.set('src', value)

  assert.equal(el.node['src'], value, 'Node src parameter should be set')
  assert.equal(el.props.props['src'], value, 'Props src parameter should be set')
  assert.equal(el.props.raw.get('src'), value, "Props' raw map entry should be added")
  assert.equal(el.props.props['color'], 0xffffffff, 'Props default color parameter should be set')
  assert.end()
})

test('Element - Set `texture` property', (assert) => {
  assert.capture(renderer, 'createNode', () => new EventEmitter())
  const el = createElement()

  el.set('texture', 'foo')

  assert.equal(el.node['texture'], 'foo', 'Node texture parameter should be set')
  assert.equal(el.props.props['texture'], 'foo', 'Props texture parameter should be set')
  assert.equal(el.props.raw.get('texture'), 'foo', "Props' raw map entry should be added")
  assert.equal(el.props.props['color'], 0xffffffff, 'Props default color parameter should be set')
  assert.end()
})

function createElement() {
  const el = element({}, {})
  el.populate({
    parent: {
      node: new EventEmitter(),
    },
  })
  return el
}
