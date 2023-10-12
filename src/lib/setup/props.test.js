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
import propsFn from './props.js'
import { initLog } from '../log.js'

initLog()

test('Type props function', (assert) => {
  const expected = 'function'
  const actual = typeof propsFn

  assert.equal(actual, expected, 'props should be a function')
  assert.end()
})

test('Create a ___propkeys on component', (assert) => {
  const component = new Function()

  /* eslint-disable */
  assert.false(component.hasOwnProperty('___propKeys'), 'Component should not have a ___propKeys key')

  propsFn(component)

  /* eslint-disable */
  assert.true(component.hasOwnProperty('___propKeys'), 'Component should have a ___propKeys key')
  assert.end()
})

test('Pass props as an array', (assert) => {
  const component = new Function()
  const props = ['index', 'img', 'url']
  propsFn(component, props)

  assert.equal(props.length, component.___propKeys.length, 'All passed props should be stored on ___propKeys')
  assert.equal(props.length, props.map(prop => component.___propKeys.indexOf(prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on ___propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component.prototype, prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})


test('Get value of props', (assert) => {
  const component = new Function()

  const componentInstance = new component
  componentInstance.___props = {
    index: 1,
    img: 'lorem-ipsum.jpg',
    url: 'http://localhost'
  }

  const componentInstance2 = new component
  componentInstance2.___props = {
    index: 2,
    img: 'bla.jpg',
    url: 'http://127.0.0.1'
  }

  const props = ['index', 'img', 'url']
  propsFn(component, props)

  props.forEach((prop) => {
    assert.equal(componentInstance[prop], componentInstance.___props[prop], `The correct value of ${prop} should be returned via the getter`)
    assert.equal(componentInstance2[prop], componentInstance2.___props[prop], `The correct value of ${prop} should be returned via the getter`)
  })

  assert.equal(componentInstance['bla'], undefined, `Undefined should be returned if a prop doesn't exist`)
  assert.end()
})

test('Passing props as an object', (assert) => {

  const component = new Function()
  const props = [{key: 'index'}, {key: 'img'}, {key: 'url'}]
  propsFn(component, props)

  assert.equal(props.length, component.___propKeys.length, 'All passed props should be stored on ___propKeys')
  assert.equal(props.length, props.map(prop => component.___propKeys.indexOf(typeof prop === 'object' ? prop.key : prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on ___propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component.prototype, typeof prop === 'object' ? prop.key : prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})

test('Passing props as an object mixed with single keys', (assert) => {

  const component = new Function()
  const props = [{key: 'index'}, 'img', {key: 'url'}]
  propsFn(component, props)

  assert.equal(props.length, component.___propKeys.length, 'All passed props should be stored on ___propKeys')
  assert.equal(props.length, props.map(prop => component.___propKeys.indexOf(typeof prop === 'object' ? prop.key : prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on ___propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component.prototype, typeof prop === 'object' ? prop.key : prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})

test('Casting props to a type', (assert) => {
  const component = new Function()

  const componentInstance = new component
  componentInstance.___props = {
    number: '1',
    string: 100,
    boolean: true,
    image: 'my_image.jpg'
  }

  const props = [{
    key: 'number',
    cast: Number
  }, {
    key: 'string',
    cast: String
  }, {
    key: 'boolean',
    cast: Boolean
  },{
    key: 'image',
    cast(v) {
      return `http://localhost/${v}`
    }
  }]
  propsFn(component, props)

  assert.true(typeof componentInstance.number === 'number', 'Should cast prop value to a Number')
  assert.true(typeof componentInstance.string === 'string', 'Should cast prop value to a String')
  assert.true(typeof componentInstance.boolean === 'boolean', 'Should cast prop value to a Boolean')
  assert.equal(componentInstance.image, 'http://localhost/my_image.jpg','Should cast according to a custom function')

  assert.end()
})

test('Setting default value for undefined props', (assert) => {
  const component = new Function()

  const componentInstance = new component

  const props = [{
    key: 'missing',
    default: 'I am missing'
  }]
  propsFn(component, props)

  assert.equal(componentInstance.missing, 'I am missing','Should return default prop value when undefined')

  assert.end()
})

test('Required props with default', (assert) => {
  const component = new Function()

  const componentInstance = new component

  const props = [{
    key: 'missing',
    default: 'I am missing',
    required: true
  }]
  propsFn(component, props)

  assert.equal(componentInstance.missing, 'I am missing', 'Should return default prop value when undefined')

  assert.end()
})

test('Required props without default', (assert) => {
  const component = new Function()

  const componentInstance = new component

  const props = [{
    key: 'missing',
    required: true
  }]
  propsFn(component, props)

  assert.equal(componentInstance.missing, undefined, 'Should return undefined prop value when undefined')
  // todo: should log a warning about prop being required

  assert.end()
})

// todo add test when setting a prop (should work, but should log a warning about avoiding mutating a prop)
