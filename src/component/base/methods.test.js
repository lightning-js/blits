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
import methods from './methods.js'
import symbols from '../../lib/symbols.js'
import Settings from '../../settings.js'
import { initLog } from '../../lib/log.js'
import timeouts_intervals from './timeouts_intervals.js'
import { registerHooks } from '../../lib/hooks.js'
import lifecycle from '../../lib/lifecycle.js'
import { reactive } from '../../lib/reactivity/reactive.js'
import { effect, removeEffects } from '../../lib/reactivity/effect.js'

initLog()

test('Methods - Should contain all the defined methods', (assert) => {
  const component = Object.defineProperties({}, { ...methods })

  assert.equal(typeof component.$focus, 'function', 'should have $focus method')
  assert.equal(typeof component.unfocus, 'function', 'should have unfocus method')
  assert.equal(typeof component.destroy, 'function', 'should have destroy method')
  assert.equal(
    typeof component[symbols.removeEffects],
    'function',
    'should have removeEffects method'
  )
  assert.equal(typeof component.$trigger, 'function', 'should have $trigger method')
  assert.equal(typeof component.$select, 'function', 'should have $select method')
  assert.end()
})

test('Methods - Validate $focus and unfocus method behavior', (assert) => {
  // flags to verify if hooks are called
  let focusHookCalled = false
  let unfocusHookCalled = false

  // component configuration with hooks
  const componentConfig = {
    hooks: {
      focus() {
        focusHookCalled = true
        assert.equal(
          this[symbols.state].$hasFocus,
          false,
          'hasFocus should be false by the time focus hook is called'
        )
      },
      unfocus() {
        unfocusHookCalled = true
        assert.equal(
          this[symbols.state].$hasFocus,
          false,
          'hasFocus should be false by the time unfocus hook is called'
        )
      },
    },
  }

  // create component with necessary properties and methods
  const component = Object.defineProperties(
    {
      [symbols.identifier]: 1,
      componentId: 'TestComponent_1',
      [symbols.state]: { $hasFocus: false },
    },
    { ...methods }
  )

  // register lifecycle
  component[symbols.lifecycle] = Object.assign(Object.create(lifecycle), {
    component: component,
    previous: null,
    current: null,
  })

  // register hooks based on component identifier
  registerHooks(componentConfig.hooks, component[symbols.identifier])

  component.$focus()
  setTimeout(() => {
    assert.equal(component[symbols.lifecycle].state, 'focus', 'lifecycle state should be focus')
    assert.equal(focusHookCalled, true, 'focus hook should be called')
    assert.equal(
      component[symbols.state].$hasFocus,
      true,
      'hasFocus should be true only after focus hook is called'
    )
    component.unfocus()
    setTimeout(() => {
      assert.equal(
        component[symbols.lifecycle].state,
        'unfocus',
        'lifecycle state should be unfocus'
      )
      assert.equal(unfocusHookCalled, true, 'unfocus hook should be called')
      assert.end()
    }, 100)
  }, 100)
})

test('Methods - Refocus already focused component', (assert) => {
  const component = Object.defineProperties(
    {
      [symbols.state]: { $hasFocus: true },
      [symbols.lifecycle]: { state: 'focus' },
    },
    { ...methods }
  )

  component.$focus()
  assert.equal(component[symbols.lifecycle].state, 'refocus', 'lifecycle state should be focus')
  setTimeout(() => {
    assert.equal(component[symbols.lifecycle].state, 'focus', 'lifecycle state should be focus')
    assert.end()
  }, 100)
})

test('Methods - Validate $select method behavior', (assert) => {
  const ChildComponent = function (id, ref) {
    this.componentId = id
    this.ref = ref
  }

  const component = Object.defineProperties(
    {
      [symbols.children]: [
        new ChildComponent('child1', 'child1'),
        new ChildComponent('child3', 'child3'),
      ],
    },
    { ...methods }
  )

  let child = component.$select('child3')
  assert.equal(child.componentId, 'child3', '$select should return the correct child')

  const noChild = component.$select('nonexistent')
  assert.equal(noChild, null, '$select should return null for nonexistent child')
  assert.end()
})

test('Methods - Validate $select method with nested array of children structure', (assert) => {
  const ChildComponent = function (id, ref) {
    this.componentId = id
    this.ref = ref
  }

  const component = Object.defineProperties(
    {
      [symbols.children]: [
        [
          new ChildComponent('childArray1', 'arrayChild1'),
          new ChildComponent('childArray2', 'arrayChild2'),
        ],
      ],
    },
    { ...methods }
  )

  let childArray1 = component.$select('arrayChild2')
  assert.equal(childArray1.componentId, 'childArray2', '$select should find child in array')

  let childArray2 = component.$select('arrayChild2')
  assert.equal(childArray2.componentId, 'childArray2', '$select should find single child object')

  const noChild = component.$select('nonexistent')
  assert.equal(noChild, null, '$select should return null for nonexistent child')
  assert.end()
})

test('Methods - Validate $select method with object of children structure', (assert) => {
  const ChildComponent = function (id, ref) {
    this.componentId = id
    this.ref = ref
  }

  const component = Object.defineProperties(
    {
      [symbols.children]: [
        { header: new ChildComponent('childHeader', 'headerRef') },
        { footer: new ChildComponent('childFooter', 'footerRef') },
      ],
    },
    { ...methods }
  )

  let childHeader = component.$select('headerRef')
  assert.equal(childHeader.componentId, 'childHeader', '$select should find child in object')

  let childFooter = component.$select('footerRef')
  assert.equal(
    childFooter.componentId,
    'childFooter',
    '$select should find another child in object'
  )

  const noChild = component.$select('nonexistent')
  assert.equal(noChild, null, '$select should return null for nonexistent child')
  assert.end()
})

test('Methods - Validate removeEffects method behavior', (assert) => {
  const component = Object.defineProperties({}, { ...methods })

  const effects = []
  // todo: use effects based on global app state properties
  component[symbols.removeEffects](effects)
  assert.pass('removeEffects should execute without error')
  assert.end()
})

test('Methods - Validate destroy method behavior', (assert) => {
  const { component, cleanupMock, holderMock, childrenDestroyMock } = getTestComponent()

  // add some timeouts and intervals to verify they are cleared as part of destroy
  component.$setTimeout(() => {}, 1000)
  component.$setInterval(() => {}, 1000)

  component.destroy()

  // Following properties can still exists in component instance but with reset/cleared values
  assert.equal(component.eol, true, 'Component should be marked as end of life')
  assert.deepEqual(component[symbols.lifecycle], {}, 'Lifecycle state should be destroy')
  assert.deepEqual(component[symbols.state], {}, 'symbol state should be deleted')
  assert.equal(
    component[symbols.rendererEventListeners],
    null,
    'Renderer event listeners should be cleared'
  )
  assert.equal(component[symbols.timeouts].length, 0, 'All timeouts should be cleared')
  assert.equal(component[symbols.intervals].length, 0, 'All intervals should be cleared')
  assert.deepEqual(component[symbols.props], {}, 'symbol props should be cleared')

  // Following properties should be deleted from component instance
  assert.equal(component[symbols.effects], undefined, 'symbol effects should be deleted')
  assert.equal(component[symbols.computed], undefined, 'symbol computed should be deleted')
  assert.equal(component[symbols.parent], undefined, 'parent should be deleted')
  assert.equal(component[symbols.rootParent], undefined, 'rootParent should be deleted')
  assert.equal(component[symbols.wrapper], undefined, 'symbol wrapper should be deleted')
  assert.equal(
    component[symbols.originalState],
    undefined,
    'symbol originalState should be deleted'
  )
  assert.equal(component[symbols.children], undefined, 'symbol children should be deleted')
  assert.equal(component[symbols.slots], undefined, 'symbol slots should be deleted')
  assert.equal(component.$componentId, undefined, 'componentId should be deleted')
  assert.equal(component[symbols.id], undefined, 'symbol id should be deleted')
  assert.equal(component.ref, undefined, 'ref should be deleted')
  assert.equal(component[symbols.holder], undefined, 'symbol holder should be deleted')
  assert.equal(component[symbols.cleanup], undefined, 'symbol cleanup should be deleted')
  assert.equal(component[symbols.holder], undefined, 'symbol holder should be deleted')
  assert.equal(component[symbols.cleanup], undefined, 'symbol cleanup should be deleted')

  // Checks to ensure holder, cleanup, children destroy hooks are called as part of destroy
  assert.equal(cleanupMock.called, true, 'Cleanup function should be called')
  assert.equal(holderMock.destroyed, true, 'Holder destroy method should be called')
  assert.equal(childrenDestroyMock.count, 4, 'All children destroy methods should be called')

  assert.end()
})

test('Methods - Destroy continues past an empty child slot', (assert) => {
  const { component, childrenDestroyMock } = getTestComponent()

  component[symbols.children].splice(1, 0, undefined)
  component.destroy()

  assert.equal(
    childrenDestroyMock.count,
    4,
    'All children after an empty slot should still be destroyed'
  )
  assert.end()
})

test('Methods - Destroy continues past an empty keyed loop entry', (assert) => {
  const { component, childrenDestroyMock } = getTestComponent()

  component[symbols.children][2] = {
    emptyItem: undefined,
    item1: { componentId: 'child3', destroy: childrenDestroyMock },
    item2: { componentId: 'child4', destroy: childrenDestroyMock },
  }
  component.destroy()

  assert.equal(
    childrenDestroyMock.count,
    4,
    'All keyed loop children after an empty entry should still be destroyed'
  )
  assert.end()
})

test('Methods - Destroy removes effects belonging to a child after an empty loop slot', (assert) => {
  const { component } = getTestComponent()
  const persistentState = reactive({ value: 0 })
  let effectCalls = 0

  const childEffect = () => {
    persistentState.value
    effectCalls++
  }
  const child = {
    destroy() {
      removeEffects([childEffect])
    },
  }

  effect(childEffect)
  component[symbols.children] = [undefined, child]
  component.destroy()

  persistentState.value = 1

  assert.equal(
    effectCalls,
    1,
    'A destroyed parent should not leave a skipped child effect subscribed to persistent state'
  )

  // Keep the regression test's reactive subscription isolated from subsequent tests.
  removeEffects([childEffect])
  assert.end()
})

test('Methods - Destroy does not rerun effects when clearing array state', (assert) => {
  const { component } = getTestComponent()
  component[symbols.state] = reactive({
    $hasFocus: false,
    items: [1, 2, 3],
  })
  let effectCalls = 0

  const stateEffect = () => {
    component[symbols.state].items
    effectCalls++
  }

  component[symbols.effects].push(stateEffect)
  effect(stateEffect)

  component.destroy()

  assert.equal(effectCalls, 1, 'Destroy should not trigger effects subscribed to array state')
  assert.end()
})

test('Methods - Destroy removes effects before moving focus to the parent', (assert) => {
  const { component } = getTestComponent()
  component[symbols.state] = reactive({ $hasFocus: true })
  // mock $focus functionality on the parent
  component[symbols.parent] = {
    $focus() {
      component[symbols.state].$hasFocus = false
    },
  }
  Object.defineProperty(component, '$hasFocus', {
    get() {
      return this[symbols.state].$hasFocus
    },
  })

  let effectCalls = 0
  const focusEffect = () => {
    component[symbols.state].$hasFocus
    effectCalls++
  }

  component[symbols.effects].push(focusEffect)
  effect(focusEffect)
  component.destroy()

  assert.equal(effectCalls, 1, 'Moving focus during destroy should not run $hasFocus effects')
  assert.end()
})

test('Methods - Reactive array effects cannot abort component teardown', (assert) => {
  const { component, cleanupMock, holderMock } = getTestComponent()
  component[symbols.state] = reactive({
    $hasFocus: false,
    items: [1, 2, 3],
  })

  const stateEffect = () => {
    component[symbols.state].items
    if (component.eol === true) throw new Error('Effect ran during component teardown')
  }

  component[symbols.effects].push(stateEffect)
  effect(stateEffect)

  assert.doesNotThrow(() => component.destroy(), 'Destroy should not run reactive effects')
  assert.equal(holderMock.destroyed, true, 'Destroy should release the renderer holder')
  assert.equal(cleanupMock.called, true, 'Destroy should release generated render closures')

  // Keep this test isolated if the regression returns.
  if (holderMock.destroyed === false) {
    removeEffects([stateEffect])
    component.destroy()
  }
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

export const getTestComponent = () => {
  // mock code-generator cleanup function
  const cleanupMock = function () {
    cleanupMock.called = true
  }
  cleanupMock.called = false

  // mock holder with destroy method
  const holderMock = {
    destroy() {
      holderMock.destroyed = true
    },
  }
  holderMock.destroyed = false

  // mock children with destroy method and a counter
  const childrenDestroyMock = function () {
    childrenDestroyMock.count++
  }
  childrenDestroyMock.count = 0

  // define a component with necessary properties
  const component = Object.defineProperties(
    {
      $componentId: 'TestComponent_1',
      ref: 'mainRef',
      [symbols.id]: 'TestComponent_1',
      [symbols.state]: { $hasFocus: false },
      [symbols.state]: { prop1: 'value1', prop2: 'value2', prop3: [1, 2, 3] },
      [symbols.rendererEventListeners]: [],
      [symbols.children]: [
        { componentId: 'child1', destroy: childrenDestroyMock },
        { componentId: 'child2', destroy: childrenDestroyMock },
        {
          item1: { componentId: 'child3', destroy: childrenDestroyMock },
          item2: { componentId: 'child4', destroy: childrenDestroyMock },
        },
      ],
      [symbols.effects]: [],
      [symbols.slots]: ['slot1', 'slot2'],

      [symbols.holder]: holderMock,
      [symbols.cleanup]: cleanupMock,

      [symbols.lifecycle]: { state: 'init' },

      // not required by default but getting into error without this
      [symbols.timeouts]: [],
      [symbols.intervals]: [],
      [symbols.debounces]: new Map(),
    },
    { ...methods, ...timeouts_intervals }
  )

  return { component, cleanupMock, holderMock, childrenDestroyMock }
}
