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
import Component from './component.js'
import { initLog } from './lib/log.js'
import symbols from './lib/symbols.js'
import util from 'node:util'
import { renderer, stage } from './launch.js'

initLog()

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof Component

  assert.equal(actual, expected, 'Component should be a function')
  assert.end()
})

test('Component - Factory function', (assert) => {
  const expected = 'function'
  const actual = typeof Component('my component', {})

  assert.equal(actual, expected, 'Component should be a factory function (i.e. return a function)')
  assert.end()
})

test('Component - Factory requires a name to be passed', (assert) => {
  assert.throws(() => {
    Component()
  }, 'Throw an error when no name argument has been passed')

  assert.end()
})

test('Component - Factory requires a config to be passed', (assert) => {
  assert.throws(() => {
    Component('Foo')
  }, 'Throw an error when no config argument has been passed')

  assert.end()
})

test('Component - Instance should create internal id', (assert) => {
  const button = Component('Button', {})()
  const heading = Component('Heading', {})()

  assert.equal(button[symbols.id], 1, 'Button instance object should have correct internal id')
  assert.equal(heading[symbols.id], 2, 'Heading instance object should have correct internal id')
  assert.end()
})

test('Component - Instance should create component Id', (assert) => {
  const foo = Component('Foo', {})
  const bar = Component('Bar', {})
  const fooInstance0 = foo()
  const fooInstance1 = foo()
  const barInstance0 = bar()

  assert.equal(
    fooInstance0.componentId,
    'BlitsComponent::Foo_1',
    'First Foo instance should have correct id'
  )
  assert.equal(
    fooInstance1.componentId,
    'BlitsComponent::Foo_2',
    'Second Foo instance should have correct id'
  )
  assert.equal(
    barInstance0.componentId,
    'BlitsComponent::Bar_1',
    'First Bar instance should have correct id'
  )
  assert.end()
})

test('Component - Instance should initiate lifecycle object', (assert) => {
  const foo = Component('Foo', {})()

  assert.ok(foo.lifecycle, 'Lifecycle object should be initialized')
  assert.equal(
    foo.lifecycle.component,
    foo,
    'Lifecycle object should have a reference to foo instance'
  )
  assert.equal(
    foo.lifecycle.previous,
    null,
    'Lifecycle object should have previous state not initialized'
  )
  assert.equal(foo.lifecycle.current, 'init', 'Lifecycle object should have initial current state')
  assert.end()
})

test('Component - Instance should set a parent reference', (assert) => {
  const parentElement = {}
  const parentComponent = {}

  const foo = Component('Foo', {})({}, parentElement, parentComponent)

  assert.equal(
    foo.parent,
    parentComponent,
    'Foo instance object should have parent component object reference'
  )
  assert.equal(
    foo[symbols.holder],
    parentElement,
    'Foo instance object should have parent element object reference'
  )
  assert.end()
})

test('Component - Instance should set a root reference', (assert) => {
  const root = {}

  const foo = Component('Foo', {})({}, {}, {}, root)

  assert.equal(
    foo.rootParent,
    root,
    'Foo instance object should have root component object reference'
  )
  assert.end()
})

test('Component - Instance should initialize reactive props', (assert) => {
  const foo = Component(
    'Foo',
    {}
  )({
    props: { foo: 'bar' },
  })

  const props = foo[symbols.props]

  assert.ok(props, 'Foo instance should have props defined')
  assert.ok(util.types.isProxy(props), 'Foo instance props should be proxy')
  assert.equal(props.foo, 'bar')
  assert.end()
})

test('Component - Instance should initialize timeouts array', (assert) => {
  const foo = Component('Foo', {})()

  const timeouts = foo[symbols.timeouts]

  assert.ok(Array.isArray(timeouts), 'Foo instance timeouts should be an array')
  assert.end()
})

test('Component - Instance should initialize intervals array', (assert) => {
  const foo = Component('Foo', {})()

  const intervals = foo[symbols.intervals]

  assert.ok(Array.isArray(intervals), 'Foo instance intervals should be an array')
  assert.end()
})

test('Component - Instance should initialize originalState', (assert) => {
  const config = {
    state() {
      return {
        foo: 'bar',
      }
    },
  }
  const foo = Component('Foo', config)()

  const state = foo[symbols.originalState]

  assert.equal(state.foo, 'bar', 'Foo instance should store originalState properties')
  assert.equal(state.hasFocus, false, 'Foo instance should store originalState hasFocus property')
  assert.end()
})

test('Component - Instance should initialize reactive state', (assert) => {
  const config = {
    state() {
      return {
        foo: 'bar',
      }
    },
  }
  const foo = Component('Foo', config)()

  const state = foo[symbols.state]

  assert.ok(state, 'Foo instance should have state defined')
  assert.ok(util.types.isProxy(state), 'Foo instance state should be proxy')
  assert.equal(state.foo, 'bar')
  assert.end()
})

test('Component - Instance should initialize children', (assert) => {
  const parent = {}
  const expected = []
  const config = {
    code: {
      render: () => {},
      effects: [],
    },
    state() {
      return {
        foo: 'bar',
      }
    },
  }
  const capture = assert.capture(config.code, 'render', () => expected)
  const foo = Component('Foo', config)({}, parent)

  const children = foo[symbols.children]

  assert.ok(Array.isArray(children), 'Foo instance children should be an array')
  assert.equal(children, expected, 'Children should be an expected array')
  const args = capture()[0].args
  assert.equal(args[0], parent, 'Render should be called with parent parameter')
  assert.equal(args[1], foo, 'Render should be called with Foo component instance')
  assert.equal(args[2], config, 'Render should be called with config parameter')
  assert.ok(args[3].Layout, 'Render should be called with global components object')
  assert.end()
})

test('Component - Instance should initialize wrapper', (assert) => {
  const expected = {}
  const config = {
    code: {
      render: () => [expected],
      effects: [],
    },
  }
  const foo = Component('Foo', config)()

  const wrapper = foo[symbols.wrapper]

  assert.equal(wrapper, expected, 'Wrapper should be a first element of the children')
  assert.end()
})

test('Component - Instance should initialize slots', (assert) => {
  const expected = {
    [symbols.isSlot]: true,
  }
  const config = {
    code: {
      render: () => [{}, {}, expected, {}],
      effects: [],
    },
  }
  const foo = Component('Foo', config)()

  const slots = foo[symbols.slots]

  assert.ok(Array.isArray(slots), 'Slots should be an array')
  assert.equal(slots[0], expected, 'Slot should be a expected element of the children')
  assert.end()
})

test('Component - Instance should initialize hook events', (assert) => {
  const wrapper = {
    node: {
      on() {},
    },
  }
  const rendererCapture = assert.capture(renderer, 'on')
  const nodeCapture = assert.capture(wrapper.node, 'on')
  const config = {
    code: {
      render: () => [wrapper],
      effects: [],
    },
    hooks: {
      frameTick() {},
      idle() {},
      attach() {},
      detach() {},
      enter() {},
      exit() {},
    },
  }
  Component('Foo', config)()

  const rendererCalls = rendererCapture()
  assert.equal(
    rendererCalls[0].args[0],
    'frameTick',
    '`frameTick` event should be registered in Renderer'
  )
  assert.equal(rendererCalls[1].args[0], 'idle', '`idle` event should be registered in Renderer')
  const nodeCalls = nodeCapture()
  assert.equal(
    nodeCalls[0].args[0],
    'inBounds',
    '`inBounds` event should be registered in the wrapper'
  )
  assert.equal(
    nodeCalls[1].args[0],
    'outOfBounds',
    '`outOfBounds` event should be registered in the wrapper'
  )
  assert.equal(
    nodeCalls[2].args[0],
    'inViewport',
    '`inViewport` event should be registered in the wrapper'
  )
  assert.equal(
    nodeCalls[3].args[0],
    'outOfViewport',
    '`outOfViewport` event should be registered in the wrapper'
  )
  assert.end()
})

test('Component - Instance should execute all side effects', (assert) => {
  const root = {}
  const capture = assert.captureFn(() => {})
  const children = []
  const config = {
    code: {
      render: () => children,
      effects: [capture],
    },
  }
  const foo = Component('Foo', config)({}, {}, {}, root)

  const calls = capture.calls[0]
  assert.equals(calls.receiver, stage, 'Effect`s receiver should be the stage object')
  assert.equals(calls.args[0], foo, 'Effect should be invoked with foo component instance')
  assert.equals(calls.args[1], children, 'Effect should be invoked with component`s children')
  assert.equals(calls.args[2], config, 'Effect should be invoked with config object')
  assert.ok(calls.args[3].Layout, 'Effect should be invoked with global components object')
  assert.equals(calls.args[4], root, 'Effect should be invoked with root component')
  assert.ok(typeof calls.args[5] === 'function', 'Effect should be invoked with effect function')
  assert.end()
})

test('Component - Instance should have all symbols configured', (assert) => {
  const config = {
    state() {
      return {
        foo: 'bar',
      }
    },
    watch: {
      foo(value, oldValue) {},
    },
  }
  const foo = Component('Foo', config)()

  Object.getOwnPropertySymbols(foo).forEach((symbol) => {
    const descriptor = Object.getOwnPropertyDescriptor(foo, symbol)
    assert.ok(descriptor.enumerable === false, `${symbol.description} should not be enumerable`)
    assert.ok(descriptor.configurable === false, `${symbol.description} should not be configurable`)
  })
  assert.end()
})

test('Component - Instance should have ready state after the next process tick', (assert) => {
  assert.plan(1)

  const foo = Component('Foo', {})()

  setTimeout(() => {
    assert.equal(
      foo.lifecycle.state,
      'ready',
      'Foo component lifecycle should be eventually in a ready state'
    )
  })
})
