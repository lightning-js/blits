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
import { initLog } from '../../lib/log.js'
import Settings from '../../settings.js'
import symbols from '../../lib/symbols.js'

test('Type props function', (assert) => {
  const expected = 'function'
  const actual = typeof propsFn

  assert.equal(actual, expected, 'props should be a function')
  assert.end()
})

test('Has correct symbols', (assert) => {
  const component = new Function()
  const props = ['index', 'img', 'url']
  propsFn(component, props)
  /* eslint-disable */
  assert.true(component[symbols.propKeys], 'Component should have a propKey symbol')
  assert.end()
})

test('Pass props as an array', (assert) => {
  const component = new Function()
  const props = ['index', 'img', 'url']
  propsFn(component, props)

  assert.equal(props.length, component[symbols.propKeys].length, 'All passed props should be stored on propKeys')
  assert.equal(props.length, props.map(prop => component[symbols.propKeys].indexOf(prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component, prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})


test('Get value of props', (assert) => {
  const component = new Function()

  const componentInstance = Object.create(component)
  componentInstance[symbols.props] = {
    index: 1,
    img: 'lorem-ipsum.jpg',
    url: 'http://localhost'
  }

  const componentInstance2 = Object.create(component)
  componentInstance2[symbols.props] = {
    index: 2,
    img: 'bla.jpg',
    url: 'http://127.0.0.1'
  }

  const props = ['index', 'img', 'url']
  propsFn(component, props)

  props.forEach((prop) => {
    assert.equal(componentInstance[prop], componentInstance[symbols.props][prop], `The correct value of ${prop} should be returned via the getter`)
    assert.equal(componentInstance2[prop], componentInstance2[symbols.props][prop], `The correct value of ${prop} should be returned via the getter`)
  })

  assert.equal(componentInstance['bla'], undefined, `Undefined should be returned if a prop doesn't exist`)
  assert.end()
})

test('Passing props as an object', (assert) => {

  const component = new Function()
  const props = [{key: 'index'}, {key: 'img'}, {key: 'url'}]
  propsFn(component, props)

  assert.equal(props.length, component[symbols.propKeys].length, 'All passed props should be stored on propKeys')
  assert.equal(props.length, props.map(prop => component[symbols.propKeys].indexOf(typeof prop === 'object' ? prop.key : prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component, typeof prop === 'object' ? prop.key : prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})

test('Passing props as an object mixed with single keys', (assert) => {

  const component = new Function()
  const props = [{key: 'index'}, 'img', {key: 'url'}]
  propsFn(component, props)

  assert.equal(props.length, component[symbols.propKeys].length, 'All passed props should be stored on propKeys')
  assert.equal(props.length, props.map(prop => component[symbols.propKeys].indexOf(typeof prop === 'object' ? prop.key : prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component, typeof prop === 'object' ? prop.key : prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})

test('Casting props to a type', (assert) => {
  const component = new Function()

  const componentInstance = Object.create(component)
  componentInstance[symbols.props] = {
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

  assert.equal(typeof componentInstance.number, 'number', 'Should cast prop value to a Number')
  assert.equal(typeof componentInstance.string, 'string', 'Should cast prop value to a String')
  assert.equal(typeof componentInstance.boolean, 'boolean', 'Should cast prop value to a Boolean')
  assert.equal(componentInstance.image, 'http://localhost/my_image.jpg','Should cast according to a custom function')

  assert.end()
})

test('Setting default value for undefined props', (assert) => {
  const component = new Function()

  const componentInstance = Object.create(component)

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

  const componentInstance = Object.create(component)

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
  initLogTest(assert)
  const capture = assert.capture(console, 'warn')
  const component = new Function()

  const componentInstance = Object.create(component)

  const props = [{
    key: 'missing',
    required: true
  }]
  propsFn(component, props)

  assert.equal(componentInstance.missing, undefined, 'Should return undefined prop value when undefined')
  const logs = capture()
  assert.equal(logs.length, 1)
  assert.equal(logs[0].args.pop(), 'missing is required', 'Should log warning message')

  assert.end()
})

test('Setting prop value directly', (assert) => {
  initLogTest(assert)
  const capture = assert.capture(console, 'warn')
  const component = new Function()
  const componentInstance = Object.create(component)
  componentInstance[symbols.props] = {
    property: 'foo'
  }
  const props = [{
    key: 'property',
  }]

  propsFn(component, props)
  componentInstance.property = 'bar'

  assert.equal(componentInstance[symbols.props].property, 'bar', 'Should be possible to mutate the property')
  let logs = capture()
  assert.equal(logs.length, 1)
  assert.equal(logs[0].args.pop(), 'Warning! Avoid mutating props directly (property)', 'Should log warning message')

  assert.end()
})

function initLogTest(assert) {
  assert.capture(Settings, 'get', (key) => {
    if (key === 'debugLevel') {
      return 1
    }
  })
  initLog()
}
