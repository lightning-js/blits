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
import { initLog } from '../lib/log.js'
import Hover from './hover.js'
import symbols from '../lib/symbols.js'

initLog()

const createComponent = (id, parent) => ({
  $componentId: id,
  [symbols.parent]: parent,
  [symbols.lifecycle]: { state: 'init' },
})

test('Public methods on Hover object', (assert) => {
  assert.true(typeof Hover.get === 'function', 'Hover should have a get method')
  assert.true(typeof Hover.set === 'function', 'Hover should have a set method')
  assert.true(typeof Hover.clear === 'function', 'Hover should have a clear method')
  assert.end()
})

test('Setting hover on single component', (assert) => {
  const comp = createComponent('comp1')
  Hover.set(comp)
  assert.equal(Hover.get(), comp, 'get returns set component')
  assert.equal(comp[symbols.lifecycle].state, 'hover', 'component has lifecycle state hover')
  Hover.clear()
  assert.end()
})

test('Hovering along hover path', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  Hover.set(comp)
  assert.equal(Hover.get(), comp, 'get returns leaf component')
  assert.equal(parent[symbols.lifecycle].state, 'hover', 'parent hovered')
  assert.equal(comp[symbols.lifecycle].state, 'hover', 'component hovered')
  Hover.clear()
  assert.end()
})

test('Moving hover to child keeps parent hovered', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  Hover.set(parent)
  Hover.set(comp)
  assert.equal(Hover.get(), comp, 'get returns child')
  assert.equal(parent[symbols.lifecycle].state, 'hover', 'parent remains hovered')
  Hover.clear()
  assert.end()
})

test('Moving hover to parent unhovers child', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  Hover.set(comp)
  Hover.set(parent)
  assert.equal(Hover.get(), parent, 'get returns parent')
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'child unhovered')
  Hover.clear()
  assert.end()
})

test('Unhover full chain when setting hover on unrelated component', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  const other = createComponent('other')
  Hover.set(comp)
  Hover.set(other)
  assert.equal(Hover.get(), other, 'hover moves to unrelated component')
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'previous leaf unhovered')
  assert.equal(parent[symbols.lifecycle].state, 'unhover', 'previous parent unhovered')
  assert.equal(other[symbols.lifecycle].state, 'hover', 'other hovered')
  Hover.clear()
  assert.end()
})

test('Unhover partial chain when moving to sibling', (assert) => {
  const grandparent = createComponent('grandparent')
  const parent = createComponent('parent', grandparent)
  const comp = createComponent('comp1', parent)
  const other = createComponent('other', parent)
  Hover.set(comp)
  Hover.set(other)
  assert.equal(Hover.get(), other, 'hover moves to sibling')
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'previous leaf unhovered')
  assert.equal(parent[symbols.lifecycle].state, 'hover', 'parent hovered')
  assert.equal(grandparent[symbols.lifecycle].state, 'hover', 'grandparent hovered')
  assert.equal(other[symbols.lifecycle].state, 'hover', 'sibling hovered')
  Hover.clear()
  assert.end()
})

test('Unhover partial chain when moving to cousin', (assert) => {
  const grandparent = createComponent('grandparent')
  const parentA = createComponent('parentA', grandparent)
  const parentB = createComponent('parentB', grandparent)
  const compA = createComponent('compA', parentA)
  const compB = createComponent('compB', parentB)
  Hover.set(compA)
  Hover.set(compB)
  assert.equal(Hover.get(), compB, 'hover moves to cousin')
  assert.equal(compA[symbols.lifecycle].state, 'unhover', 'compA unhovered')
  assert.equal(parentA[symbols.lifecycle].state, 'unhover', 'parentA unhovered')
  assert.equal(grandparent[symbols.lifecycle].state, 'hover', 'grandparent hovered')
  assert.equal(parentB[symbols.lifecycle].state, 'hover', 'parentB hovered')
  assert.equal(compB[symbols.lifecycle].state, 'hover', 'compB hovered')
  Hover.clear()
  assert.end()
})

test('Clear hover resets get and unhovers chain', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  Hover.set(comp)
  Hover.clear()
  assert.equal(Hover.get(), null, 'get is null after clear')
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'leaf unhovered')
  assert.equal(parent[symbols.lifecycle].state, 'unhover', 'parent unhovered')
  assert.end()
})

test('Clear hover when already null is no-op', (assert) => {
  assert.equal(Hover.get(), null, 'get is null initially')
  Hover.clear()
  assert.equal(Hover.get(), null, 'get remains null after clear')
  assert.end()
})

test('Setting hover on same component is no-op', (assert) => {
  const comp = createComponent('comp1')
  Hover.set(comp)
  Hover.set(comp)
  assert.equal(Hover.get(), comp, 'hover remains on same component')
  Hover.clear()
  assert.end()
})

test('Setting hover with undefined or destroyed component leaves hover unchanged', (assert) => {
  const comp = createComponent('comp1')
  Hover.set(comp)
  Hover.set(undefined)
  const destroyed = createComponent('destroyed')
  destroyed.eol = true
  Hover.set(destroyed)
  assert.equal(Hover.get(), comp, 'hover remains on initial component')
  Hover.clear()
  assert.end()
})

test('Destroyed components in chain are skipped on unhover, set, and clear', (assert) => {
  const parent = createComponent('parent')
  const comp = createComponent('comp1', parent)
  const other = createComponent('other')
  Hover.set(comp)
  parent.eol = true
  Hover.set(other)
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'comp unhovered when moving to other')
  assert.notEqual(
    parent[symbols.lifecycle].state,
    'unhover',
    'destroyed parent skipped for unhover'
  )
  Hover.set(comp)
  assert.equal(Hover.get(), comp, 'hover can be set again on component')
  assert.equal(comp[symbols.lifecycle].state, 'hover', 'component hovered')
  Hover.clear()
  assert.equal(comp[symbols.lifecycle].state, 'unhover', 'clear unhovers comp')
  assert.equal(Hover.get(), null, 'clear resets get')
  assert.end()
})
