import test from 'tape'
import methods from './methods.js'
import symbols from '../../lib/symbols.js'
import Settings from '../../settings.js'
import { initLog } from '../../lib/log.js'
import timeouts_intervals from './timeouts_intervals.js'
import { registerHooks } from '../../lib/hooks.js'
import lifecycle from '../../lib/lifecycle.js'

test('Methods - Should contain all the defined methods', (assert) => {
  const component = Object.defineProperties({}, { ...methods })

  assert.equal(typeof component.focus, 'function', 'should have focus method')
  assert.equal(typeof component.$focus, 'function', 'should have $focus method')
  assert.equal(typeof component.unfocus, 'function', 'should have unfocus method')
  assert.equal(typeof component.destroy, 'function', 'should have destroy method')
  assert.equal(
    typeof component[symbols.removeGlobalEffects],
    'function',
    'should have removeGlobalEffects method'
  )
  assert.equal(typeof component.trigger, 'function', 'should have trigger method')
  assert.equal(typeof component.$trigger, 'function', 'should have $trigger method')
  assert.equal(typeof component.select, 'function', 'should have select method')
  assert.equal(typeof component.$select, 'function', 'should have $select method')
  assert.equal(typeof component.shader, 'function', 'should have $shader method')
  assert.end()
})

test('Methods - Validate focus method behavior', (assert) => {
  initLogTest(assert)
  const capture = assert.capture(console, 'warn')

  const component = Object.defineProperties(
    {
      [symbols.state]: { hasFocus: false },
      lifecycle: { state: 'init' }, // mock lifecycle
    },
    { ...methods }
  )

  component.focus()

  let logs = capture()
  assert.equal(logs.length, 1)
  assert.equal(
    logs[0].args.pop(),
    'this.focus is deprecated, use this.$focus instead',
    'Should log warning message'
  )

  setTimeout(() => {
    assert.equal(component.lifecycle.state, 'focus', 'lifecycle state should be focus')
    assert.end()
  }, 100)
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
          this[symbols.state].hasFocus,
          false,
          'hasFocus should be false by the time focus hook is called'
        )
      },
      unfocus() {
        unfocusHookCalled = true
        assert.equal(
          this[symbols.state].hasFocus,
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
      [symbols.state]: { hasFocus: false },
    },
    { ...methods }
  )

  // register lifecycle
  component.lifecycle = Object.assign(Object.create(lifecycle), {
    component: component,
    previous: null,
    current: null,
  })

  // register hooks based on component identifier
  registerHooks(componentConfig.hooks, component[symbols.identifier])

  component.$focus()
  setTimeout(() => {
    assert.equal(component.lifecycle.state, 'focus', 'lifecycle state should be focus')
    assert.equal(focusHookCalled, true, 'focus hook should be called')
    assert.equal(
      component[symbols.state].hasFocus,
      true,
      'hasFocus should be true only after focus hook is called'
    )
    component.unfocus()
    setTimeout(() => {
      assert.equal(component.lifecycle.state, 'unfocus', 'lifecycle state should be unfocus')
      assert.equal(unfocusHookCalled, true, 'unfocus hook should be called')
      assert.end()
    }, 100)
  }, 100)
})

test('Methods - Refocus already focused component', (assert) => {
  const component = Object.defineProperties(
    {
      [symbols.state]: { hasFocus: true },
      lifecycle: { state: 'focus' },
    },
    { ...methods }
  )

  component.$focus()
  assert.equal(component.lifecycle.state, 'refocus', 'lifecycle state should be focus')
  setTimeout(() => {
    assert.equal(component.lifecycle.state, 'focus', 'lifecycle state should be focus')
    assert.end()
  }, 100)
})

test('Methods - Validate select method behavior', (assert) => {
  initLogTest(assert)
  const capture = assert.capture(console, 'warn')

  const ChildComponent = function (id, ref) {
    this.componentId = id
    this.ref = ref
  }

  const component = Object.defineProperties(
    {
      [symbols.children]: [
        new ChildComponent('child1', 'child1'),
        new ChildComponent('child2', 'child2'),
      ],
    },
    { ...methods }
  )

  let child = component.select('child2')
  assert.equal(child.componentId, 'child2', 'select should return the correct child')

  let logs = capture()
  assert.equal(logs.length, 1)
  assert.equal(
    logs[0].args.pop(),
    'this.select is deprecated, use this.$select instead',
    'Should log warning message'
  )

  const noChild = component.select('nonexistent')
  assert.equal(noChild, null, 'select should return null for nonexistent child')
  assert.end()
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

test('Methods - Validate shader method behavior', (assert) => {
  const component = Object.defineProperties({}, { ...methods })

  const shaderObj = component.shader('customShader', { prop1: 2.0, prop2: 'fast' })
  assert.equal(typeof shaderObj, 'object', 'shader should return an object')
  assert.equal(shaderObj.type, 'customShader', 'shader object should have correct type')
  assert.equal(shaderObj.props.prop1, 2.0, 'shader object should have correct prop1')
  assert.equal(shaderObj.props.prop2, 'fast', 'shader object should have correct prop2')
  assert.end()
})

test('Methods - Validate removeGlobalEffects method behavior', (assert) => {
  const component = Object.defineProperties({}, { ...methods })

  const effects = []
  // todo: use effects based on global app state properties
  component[symbols.removeGlobalEffects](effects)
  assert.pass('removeGlobalEffects should execute without error')
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
  assert.deepEqual(component.lifecycle, {}, 'Lifecycle state should be destroy')
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
  assert.equal(component.parent, undefined, 'parent should be deleted')
  assert.equal(component.rootParent, undefined, 'rootParent should be deleted')
  assert.equal(component[symbols.wrapper], undefined, 'symbol wrapper should be deleted')
  assert.equal(
    component[symbols.originalState],
    undefined,
    'symbol originalState should be deleted'
  )
  assert.equal(component[symbols.children], undefined, 'symbol children should be deleted')
  assert.equal(component[symbols.slots], undefined, 'symbol slots should be deleted')
  assert.equal(component.componentId, undefined, 'componentId should be deleted')
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
      componentId: 'TestComponent_1',
      ref: 'mainRef',
      [symbols.id]: 'TestComponent_1',
      [symbols.state]: { hasFocus: false },
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

      lifecycle: { state: 'init' },

      // not required by default but getting into error without this
      [symbols.timeouts]: [],
      [symbols.intervals]: [],
      [symbols.debounces]: new Map(),
    },
    { ...methods, ...timeouts_intervals }
  )

  return { component, cleanupMock, holderMock, childrenDestroyMock }
}
