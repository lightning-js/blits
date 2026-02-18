/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import { test } from 'tap'
import utils from './utils.js'
import symbols from '../../lib/symbols.js'

test('Type', (assert) => {
  const expected = 'object'
  const actual = typeof utils

  assert.equal(actual, expected, 'utils should be an object')
  assert.end()
})

test('$size method with dimensions', (assert) => {
  const component = {
    [symbols.holder]: {
      set: (prop, value) => {
        component[prop] = value
      },
    },
  }

  utils.$size.value.call(component, { w: 100, h: 200 })

  assert.equal(component.w, 100, 'Should set width')
  assert.equal(component.h, 200, 'Should set height')
  assert.end()
})

test('$size method with default values', (assert) => {
  const component = {
    [symbols.holder]: {
      set: (prop, value) => {
        component[prop] = value
      },
    },
  }

  utils.$size.value.call(component, {})

  assert.equal(component.w, 0, 'Should set default width')
  assert.equal(component.h, 0, 'Should set default height')
  assert.end()
})

test('$size method with undefined dimensions', (assert) => {
  const component = {
    [symbols.holder]: {
      set: (prop, value) => {
        component[prop] = value
      },
    },
  }

  utils.$size.value.call(component)

  assert.equal(component.w, 0, 'Should set default width when no dimensions')
  assert.equal(component.h, 0, 'Should set default height when no dimensions')
  assert.end()
})

test('renderer getter', (assert) => {
  const component = {}

  const renderer = utils[symbols.renderer].value.call(component)

  assert.equal(typeof renderer, 'object', 'Should return renderer object')
  assert.end()
})

test('getChildren method with no children', (assert) => {
  const component = {
    [symbols.children]: [],
    parent: null,
  }

  const children = utils[symbols.getChildren].value.call(component)

  assert.equal(children.length, 0, 'Should return empty array when no children')
  assert.end()
})

test('getChildren method with children', (assert) => {
  const child1 = { componentId: 'child1' }
  const child2 = { componentId: 'child2' }
  const component = {
    [symbols.children]: [child1, child2],
    parent: null,
  }

  const children = utils[symbols.getChildren].value.call(component)

  assert.equal(children.length, 2, 'Should return children array')
  assert.equal(children[0], child1, 'Should include first child')
  assert.equal(children[1], child2, 'Should include second child')
  assert.end()
})

test('getChildren method with parent', (assert) => {
  const parent = { [symbols.getChildren]: () => [] }
  const component = {
    [symbols.children]: [],
    parent: parent,
  }

  const children = utils[symbols.getChildren].value.call(component)

  assert.equal(children.length, 0, 'Should return empty array when parent returns empty')
  assert.end()
})

test('getChildren method with rootParent', (assert) => {
  const rootParent = { [symbols.getChildren]: () => [] }
  const component = {
    [symbols.children]: [],
    parent: null,
    rootParent: rootParent,
  }

  const children = utils[symbols.getChildren].value.call(component)

  assert.equal(children.length, 0, 'Should return empty array when rootParent returns empty')
  assert.end()
})

test('getChildren method with undefined children', (assert) => {
  const component = {
    [symbols.children]: undefined,
    parent: null,
    rootParent: null,
  }

  const children = utils[symbols.getChildren].value.call(component)

  assert.equal(children.length, 0, 'Should return empty array when children is undefined')
  assert.end()
})
