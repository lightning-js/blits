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
import generator from './generator.js'

const normalize = (str) => {
  return (
    str
      // remove comments
      .replace(/\s*\/\/.*\n/gi, '')
      // remove whitespaces
      .replace(/[\n\s\t]/gi, '')
  )
}

const scope = {
  components: {},
}

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof generator

  assert.equal(actual, expected, 'Generator should be a function')
  assert.end()
})

test('Returns an object with a render function and a context object', (assert) => {
  const result = generator.call(scope)
  const expected = 'object'
  const actual = typeof result

  assert.equal(actual, expected, 'Generator should return an object')
  assert.ok('render' in result, 'Generated object should have a render key')
  assert.ok('effects' in result, 'Generated object should have an effects key')
  assert.ok('context' in result, 'Generated object should have a context key')
  assert.end()
})

test('The render key is a function', (assert) => {
  const result = generator.call(scope)
  const expected = 'function'
  const actual = typeof result.render

  assert.equal(actual, expected, 'Render key should return a function')
  assert.end()
})

test('The effects key is an array (of functions)', (assert) => {
  const result = generator.call(scope)
  const actual = Array.isArray(result.effects)

  assert.ok(actual, 'Update key should return an Array')
  assert.end()
})

test('The contex key is an object', (assert) => {
  const result = generator.call(scope)
  const expected = 'object'
  const actual = typeof result.context

  assert.equal(actual, expected, 'Context key should return an object')
  assert.end()
})

test('Generate render and effect code for an empty template', (assert) => {
  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []

    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate render and effect code for a template with a single simple element', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context,components,effect,getRaw,Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({parent: parent || 'root'}, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
        if(inSlot === true) {
          slotChildCounter -= 1
        }
    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a simple element and a simple nested element', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
          rootComponent = null
          propData = null
          slotComponent = null
          component = null
          parent = null

          cmps.length = 0
          elms.length = 0
          components.length = 0
          elementConfigs.length = 0
          forloops.length = 0
          props.length = 0
          skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a single element with attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10',
        y: '20',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({parent: parent || 'root'}, inSlot === true ? slotComponent : component)

    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
      slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a single element with attributes with a boolean like value', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        one: 'true',
        two: 'false',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['one'] = true
    elementConfigs[0]['two'] = false
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a single element with attributes with numeric & alpha numeric value', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10e2',
        y: '100',
        h: '45%',
        w: '45.45%',
        one: 'Pure String',
        two: '123abc',
        three: '1E',
        four: 'E1',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    elementConfigs[0]['x'] = 1000
    elementConfigs[0]['y'] = 100
    elementConfigs[0]['h'] = parent.node.height * (45 / 100)
    elementConfigs[0]['w'] = parent.node.width * (45.45 / 100)
    elementConfigs[0]['one'] = "Pure String"
    elementConfigs[0]['two'] = "123abc"
    elementConfigs[0]['three'] = 1
    elementConfigs[0]['four'] = "E1"

    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)
  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with attributes and a nested element with attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10',
        y: '20',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            w: '100',
            h: '300',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}

    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 100
    elementConfigs[1]['h'] = 300
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with attributes and 2 nested elements with attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10',
        y: '20',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            w: '100',
            h: '300',
            x: '0',
          },
          {
            [Symbol.for('componentType')]: 'Element',
            w: '100',
            h: '300',
            x: '50',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}

    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 100
    elementConfigs[1]['h'] = 300
    elementConfigs[1]['x'] = 0
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[2] = {}

    elms[2] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[2]['w'] = 100
    elementConfigs[2]['h'] = 300
    elementConfigs[2]['x'] = 50
    elms[2].populate(elementConfigs[2])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with attributes and deep nested elements with attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10',
        y: '20',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            w: '100',
            h: '300',
            x: '0',
          },
          {
            [Symbol.for('componentType')]: 'Element',
            w: '100',
            h: '300',
            x: '50',
            children: [
              {
                [Symbol.for('componentType')]: 'Element',
                label: 'Hello',
              },
              {
                [Symbol.for('componentType')]: 'Element',
                label: 'World',
              },
            ],
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}

    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 100
    elementConfigs[1]['h'] = 300
    elementConfigs[1]['x'] = 0
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[2] = {}

    elms[2] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[2]['w'] = 100
    elementConfigs[2]['h'] = 300
    elementConfigs[2]['x'] = 50
    elms[2].populate(elementConfigs[2])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[2]
    elementConfigs[3] = {}

    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[3]['label'] = "Hello"
    elms[3].populate(elementConfigs[3])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[2]
    elementConfigs[4] = {}

    elms[4] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[4]['label'] = "World"
    elms[4].populate(elementConfigs[4])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with simple dynamic attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '10',
        y: '20',
        ':w': '$foo',
        ':h': '$test',
        test: 'ok',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elementConfigs[0]['w'] = component.foo
    elementConfigs[0]['h'] = component.test
    elementConfigs[0]['test'] = "ok"
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('w', component.foo)
  }
  `

  const expectedEffect2 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('h', component.test)
 }
  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 2,
    'Generator should return an effects array with 2 items'
  )
  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return first render function with the correct code'
  )
  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return second render function with the correct code'
  )

  assert.end()
})

test('Generate code for a template with an attribute with a dash', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        'my-Attribute': 'does it work?',
        x: '10',
        y: '20',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['my-Attribute'] = "does it work?"
    elementConfigs[0]['x'] = 10
    elementConfigs[0]['y'] = 20
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with dynamic attributes with code to be evaluated', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        ':attribute1': '$foo * 2',
        ':attribute2': "$ok ? 'Yes' : 'No'",
        ':attribute3': "$text.split('').reverse().join('')",
        // ':attribute4': '$bar.foo * $blah.hello' => todo
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['attribute1'] = component.foo * 2
    elementConfigs[0]['attribute2'] = component.ok ? 'Yes' : 'No'
    elementConfigs[0]['attribute3'] = component.text.split('').reverse().join('')
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('attribute1', component.foo * 2)
  }
  `

  const expectedEffect2 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('attribute2', component.ok ? 'Yes' : 'No')
  }
  `

  const expectedEffect3 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('attribute3', component.text.split('').reverse().join(''))
  }
  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 3,
    'Generator should return an effects array with 3 items'
  )
  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return first effect function with the correct code'
  )
  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return second effect function with the correct code'
  )
  assert.equal(
    normalize(actual.effects[2].toString()),
    normalize(expectedEffect3),
    'Generator should return third effect function with the correct code'
  )

  assert.end()
})

test('Generate code for a template with attribute (object)', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        w: '100',
        h: '100',
        color: '{top: 0xff0000ff, bottom: 0x008000ff, left: 0xffff00ff }',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['w'] = 100
    elementConfigs[0]['h'] = 100
    elementConfigs[0]['color'] = "{top: 0xff0000ff, bottom: 0x008000ff, left: 0xffff00ff }"
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)
  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with dynamic attribute (object)', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        w: '100',
        h: '100',
        color: '{top: $colorT, bottom: $colorB, left:$colorL}',
      },
    ],
  }

  const expectedRender = `
   function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['w'] = 100
    elementConfigs[0]['h'] = 100
    elementConfigs[0]['color'] = { top: component.colorT, bottom: component.colorB, left: component.colorL }
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with attribute (object) with mixed dynamic & static value', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        w: '100',
        h: '100',
        color: '{top: 0xff0000ff, bottom: $colorB, left: $colorL}',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['w'] = 100
    elementConfigs[0]['h'] = 100
    elementConfigs[0]['color'] = { top: 0xff0000ff, bottom: component.colorB, left: component.colorL }
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with @-listeners', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        src: 'myImage.png',
        '@loaded': '$loadedCallback',
        '@error': '$errorCallback',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['src'] = "myImage.png"
    elementConfigs[0]['@loaded'] = component['loadedCallback'] && component['loadedCallback'].bind(component)
    elementConfigs[0]['@error'] = component['errorCallback'] && component['errorCallback'].bind(component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with custom components', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Poster',
          },
          {
            [Symbol.for('componentType')]: 'Poster',
          },
        ],
      },
    ],
  }

  const scope = {
    components: {
      Poster: () => {},
    },
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[1] = {}

    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }

    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[1];
    props[2] = {}
    componentType = props[2]['is'] || 'Poster'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }

    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)

    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }
    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    cmps[3] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[3] = {}

    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    skips[3] = []
    if (typeof cmps[3] !== 'undefined') {
        for (let key in cmps[3][Symbol.for('config')].props) {
            delete elementConfigs[3][cmps[3][Symbol.for('config')].props[key]]
            skips[3].push(cmps[3][Symbol.for('config')].props[key])
        }
    }

    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[3];
    props[4] = {}
    componentType = props[4]['is'] || 'Poster'
    components[4]
    if (typeof componentType === 'string') {
        components[4] = context.components && context.components[componentType] || components[componentType]
        if (!components[4]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[4] = componentType
    }

    elms[4] = components[4].call(null, { props: props[4] }, elms[3], component)

    if (elms[4][Symbol.for('slots')][0]) {
        parent = elms[4][Symbol.for('slots')][0]
        slotComponent = elms[4]
        inSlot = true
    } else {
        parent = elms[4][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        cmps[1] = null

        props[2] = null
        components[2] = null

        cmps[3] = null

        props[4] = null
        components[4] = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with an unregistered custom component', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Poster',
          },
          {
            [Symbol.for('componentType')]: 'Poster2',
          },
        ],
      },
    ],
  }

  const scope = {
    components: {
      Poster: () => {},
    },
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] =  (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[1];
    props[2] = {}
    componentType = props[2]['is'] || 'Poster'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }
    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)
    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    cmps[3] = (context.components && context.components['Poster2']) || components['Poster2']
    parent = elms[0]
    elementConfigs[3] = {}
    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    skips[3] = []
    if (typeof cmps[3] !== 'undefined') {
        for (let key in cmps[3][Symbol.for('config')].props) {
            delete elementConfigs[3][cmps[3][Symbol.for('config')].props[key]]
            skips[3].push(cmps[3][Symbol.for('config')].props[key])
        }
    }
    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[3];
    props[4] = {}
    componentType = props[4]['is'] || 'Poster2'
    components[4]
    if (typeof componentType === 'string') {
        components[4] = context.components && context.components[componentType] || components[componentType]
        if (!components[4]) {
            throw new Error('Component "Poster2" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[4] = componentType
    }
    elms[4] = components[4].call(null, { props: props[4] }, elms[3], component)
    if (elms[4][Symbol.for('slots')][0]) {
        parent = elms[4][Symbol.for('slots')][0]
        slotComponent = elms[4]
        inSlot = true
    } else {
        parent = elms[4][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        cmps[1] = null
        props[2] = null
        components[2] = null

        cmps[3] = null
        props[4] = null
        components[4] = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with custom components with arguments', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Poster',
            x: '10',
          },
          {
            [Symbol.for('componentType')]: 'Poster',
            x: '100',
            img: '$img',
          },
        ],
      },
    ],
  }

  const scope = {
    components: {
      Poster: () => {},
    },
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['x'] = 10
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1];
    props[2] = {}
    props[2]['x'] = 10
    componentType = props[2]['is'] || 'Poster'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }
    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)
    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }
    cmps[3] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[3] = {}
    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[3]['x'] = 100
    elementConfigs[3]['img'] = component.img
    skips[3] = []
    if (typeof cmps[3] !== 'undefined') {
        for (let key in cmps[3][Symbol.for('config')].props) {
            delete elementConfigs[3][cmps[3][Symbol.for('config')].props[key]]
            skips[3].push(cmps[3][Symbol.for('config')].props[key])
        }
    }
    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[3];
    props[4] = {}
    props[4]['x'] = 100
    props[4]['img'] = component.img
    componentType = props[4]['is'] || 'Poster'
    components[4]
    if (typeof componentType === 'string') {
        components[4] = context.components && context.components[componentType] || components[componentType]
        if (!components[4]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[4] = componentType
    }
    elms[4] = components[4].call(null, { props: props[4] }, elms[3], component)
    if (elms[4][Symbol.for('slots')][0]) {
        parent = elms[4][Symbol.for('slots')][0]
        slotComponent = elms[4]
        inSlot = true
    } else {
        parent = elms[4][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps[1] = null
        props[2] = null
        components[2] = null
        cmps[3] = null
        props[4] = null
        components[4] = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with custom components with argument value as numeric & alpha numeric', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Poster',
            x: '10e2',
            y: '100',
            h: '45%',
            w: '45.45%',
            one: 'Pure String',
            two: '123abc',
            three: '1E',
            four: 'E1',
          },
        ],
      },
    ],
  }

  const scope = {
    components: {
      Poster: () => {},
    },
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] =  (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[1] = {}

    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    elementConfigs[1]['x'] = 1000
    elementConfigs[1]['y'] = 100
    elementConfigs[1]['h'] = parent.node.height * (45 / 100)
    elementConfigs[1]['w'] = parent.node.width * (45.45 / 100)
    elementConfigs[1]['one'] = "Pure String"
    elementConfigs[1]['two'] = "123abc"
    elementConfigs[1]['three'] = 1
    elementConfigs[1]['four'] = "E1"

    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }

    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1];
    props[2] = {}

    props[2]['x'] = 1000
    props[2]['y'] = 100
    props[2]['h'] = parent.node.height * (45 / 100)
    props[2]['w'] = parent.node.width * (45.45 / 100)
    props[2]['one'] = "Pure String"
    props[2]['two'] = "123abc"
    props[2]['three'] = 1
    props[2]['four'] = "E1"

    componentType = props[2]['is'] || 'Poster'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }

    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)

    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps[1] = null
        props[2] = null
        components[2] = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with custom components with reactive props', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Poster',
            x: '10',
            ':img': '$image',
          },
          {
            [Symbol.for('componentType')]: 'Poster',
            x: '100',
            ':img': '$image',
          },
        ],
      },
    ],
  }

  const scope = {
    components: {
      Poster: () => {},
    },
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['x'] = 10
    elementConfigs[1]['img'] = component.image
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1];
    props[2] = {}
    props[2]['x'] = 10
    propData = component.image
    if (Array.isArray(propData) === true) {
        propData = getRaw(propData).slice(0)
    }
    props[2]['img'] = propData
    componentType = props[2]['is'] || 'Poster'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }
    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)
    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    cmps[3] = (context.components && context.components['Poster']) || components['Poster']
    parent = elms[0]
    elementConfigs[3] = {}
    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[3]['x'] = 100
    elementConfigs[3]['img'] = component.image
    skips[3] = []
    if (typeof cmps[3] !== 'undefined') {
        for (let key in cmps[3][Symbol.for('config')].props) {
            delete elementConfigs[3][cmps[3][Symbol.for('config')].props[key]]
            skips[3].push(cmps[3][Symbol.for('config')].props[key])
        }
    }
    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[3];
    props[4] = {}
    props[4]['x'] = 100
    propData = component.image
    if (Array.isArray(propData) === true) {
        propData = getRaw(propData).slice(0)
    }
    props[4]['img'] = propData
    componentType = props[4]['is'] || 'Poster'
    components[4]
    if (typeof componentType === 'string') {
        components[4] = context.components && context.components[componentType] || components[componentType]
        if (!components[4]) {
            throw new Error('Component "Poster" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[4] = componentType
    }
    elms[4] = components[4].call(null, { props: props[4] }, elms[3], component)
    if (elms[4][Symbol.for('slots')][0]) {
        parent = elms[4][Symbol.for('slots')][0]
        slotComponent = elms[4]
        inSlot = true
    } else {
        parent = elms[4][Symbol.for('children')][0]
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps[1] = null
        props[2] = null
        components[2] = null
        cmps[3] = null
        props[4] = null
        components[4] = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
   function anonymous(component, elms, context, components, rootComponent, effect) {
    if (typeof skips === 'undefined' || (typeof skips[1] === 'undefined' || skips[1].indexOf('img') === -1))
        elms[1].set('img', component.image)
  }
  `

  const expectedEffect2 = `
  function anonymous(component,elms,context,components,rootComponent,effect) {
    elms[2][Symbol.for('props')]['img'] = component.image
  }
  `

  const expectedEffect3 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    if (typeof skips === 'undefined' || (typeof skips[3] === 'undefined' ||  skips[3].indexOf('img') === -1))
        elms[3].set('img', component.image)
    }
  `

  const expectedEffect4 = `
  function anonymous(component,elms,context,components,rootComponent,effect) {
    elms[4][Symbol.for('props')]['img'] = component.image
  }
  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 4,
    'Generator should return an effects array with 4 functions'
  )

  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function that sets the value on the node'
  )

  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return an effect function that updates a prop on the first custom component'
  )

  assert.equal(
    normalize(actual.effects[2].toString()),
    normalize(expectedEffect3),
    'Generator should return an effect function that sets the value on the node'
  )

  assert.equal(
    normalize(actual.effects[3].toString()),
    normalize(expectedEffect4),
    'Generator should return an effect function that updates a prop on the second custom component'
  )

  assert.end()
})

test('Generate code for a template with a transition attributes', (assert) => {
  const templateObject = {
    children: [
      {
        ':x': '{transition: $myX}',
        ':y': '{transition: {value: $myY, duration: 600}}',
        [Symbol.for('componentType')]: 'Element',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['x'] = { transition: component.myX }
    elementConfigs[0]['y'] = { transition: { value: component.myY, duration: 600 } }
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length !== 0,
    'Generator should not return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with slot content', (assert) => {
  const scope = {
    components: {
      Page: () => {},
    },
  }

  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Page',
            w: '1920',
            h: '1080',
            children: [
              {
                [Symbol.for('componentType')]: 'Element',
                x: '100',
                y: '$y',
                ':rotation': '$rotate',
              },
            ],
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] = (context.components && context.components['Page']) || components['Page']
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 1920
    elementConfigs[1]['h'] = 1080
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1];
    props[2] = {}
    props[2]['w'] = 1920
    props[2]['h'] = 1080
    componentType = props[2]['is'] || 'Page'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Page" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }
    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)
    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }
    if (inSlot === true) {
        slotChildCounter = 1 + 1
    }

    elementConfigs[3] = {}
    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[3]
    elementConfigs[4] = {}
    elms[4] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[4]['x'] = 100
    elementConfigs[4]['y'] = component.y
    elementConfigs[4]['rotation'] = component.rotate
    elms[4].populate(elementConfigs[4])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps[1] = null
        props[2] = null
        components[2] = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
    function anonymous(component,elms,context,components,rootComponent,effect){
      elms[4].set('rotation', component.rotate)
    }
  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 1,
    'Generator should return an effects array with 1 item'
  )

  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function for the reactive rotation attribute'
  )

  assert.end()
})

test('Generate code for a template with slot content, using a named slot', (assert) => {
  const scope = {
    components: {
      Page: () => {},
    },
  }

  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Page',
            w: '1920',
            h: '1080',
            children: [
              {
                [Symbol.for('componentType')]: 'Element',
                x: '100',
                y: '$y',
                slot: 'mySlot',
              },
            ],
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    cmps[1] = (context.components && context.components['Page']) || components['Page']
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 1920
    elementConfigs[1]['h'] = 1080
    skips[1] = []
    if (typeof cmps[1] !== 'undefined') {
        for (let key in cmps[1][Symbol.for('config')].props) {
            delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
            skips[1].push(cmps[1][Symbol.for('config')].props[key])
        }
    }
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1];
    props[2] = {}
    props[2]['w'] = 1920
    props[2]['h'] = 1080
    componentType = props[2]['is'] || 'Page'
    components[2]
    if (typeof componentType === 'string') {
        components[2] = context.components && context.components[componentType] || components[componentType]
        if (!components[2]) {
            throw new Error('Component "Page" not found')
        }
    } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
        components[2] = componentType
    }
    elms[2] = components[2].call(null, { props: props[2] }, elms[1], component)
    if (elms[2][Symbol.for('slots')][0]) {
        parent = elms[2][Symbol.for('slots')][0]
        slotComponent = elms[2]
        inSlot = true
    } else {
        parent = elms[2][Symbol.for('children')][0]
    }

    if (inSlot === true) {
        slotChildCounter = 1 + 1
    }

    elementConfigs[3] = {}
    elms[3] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[3].populate(elementConfigs[3])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[3]
    elementConfigs[4] = {}
    elms[4] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[4]['x'] = 100
    elementConfigs[4]['y'] = component.y
    elementConfigs[4]['parent'] = slotComponent[Symbol.for('slots')] !== undefined &&
        Array.isArray(slotComponent[Symbol.for('slots')]) === true &&
        slotComponent[Symbol.for('slots')].filter(slot => slot.ref === 'mySlot').shift() || parent
    elementConfigs[4]['slot'] = "mySlot"
    elms[4].populate(elementConfigs[4])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    if (inSlot === true && slotChildCounter === 0) {
        inSlot = false
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps[1] = null
        props[2] = null
        components[2] = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with a slot', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            w: '1920',
            h: '1080',
            children: [
              {
                [Symbol.for('componentType')]: 'Slot',
                x: '100',
                y: '$y',
              },
            ],
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }
    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = 1920
    elementConfigs[1]['h'] = 1080
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[1]
    elementConfigs[2] = {}
    elms[2] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[2][Symbol.for('isSlot')] = true
    elementConfigs[2]['x'] = 100
    elementConfigs[2]['y'] = component.y
    elms[2].populate(elementConfigs[2])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with inline Text', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Text',
            content: 'Hello Blits!',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['content'] = 'Hello Blits!'
    elementConfigs[1]['__textnode'] = true
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with inline dynamic Text', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Text',
            content: '$myText',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['content'] = component.myText
    elementConfigs[1]['__textnode'] = true
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with inline dynamic Text embedded in static text', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Text',
            content: 'Hello {{$firstname}} {{$lastname}}, how are you?',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    elementConfigs[1]['content'] = 'Hello ' + component.firstname + ' ' + component.lastname + ', how are you?'
    elementConfigs[1]['__textnode'] = true
    elms[1].populate(elementConfigs[1])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a single element with attributes with percentages', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        w: '1920',
        h: '1080',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            w: '50%',
            h: '40%',
            x: '10%',
            y: '20%',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['w'] = 1920
    elementConfigs[0]['h'] = 1080
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    elementConfigs[1] = {}
    elms[1] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[1]['w'] = parent.node.width * (50 / 100)
    elementConfigs[1]['h'] = parent.node.height * (40 / 100)
    elementConfigs[1]['x'] = parent.node.width * (10 / 100)
    elementConfigs[1]['y'] = parent.node.height * (20 / 100)
    elms[1].populate(elementConfigs[1])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )
  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': 'item in $items',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length

        while (l--) {
            const item = rawCollection[l]
            if (l < to1 && l >= from1) {
                keys.add('' + l)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['undefined'] = __index
            scope['key'] = '' + __index
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.items, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['items',])

    return {
        elms,
        cleanup: () => {
            rootComponent = null
            propData = null
            slotComponent = null
            component = null
            parent = null

            created[1].length = 0
            forloops[1] = null
            eff1 = null

            cmps.length = 0
            elms.length = 0
            components.length = 0
            elementConfigs.length = 0
            forloops.length = 0
            props.length = 0
            skips.length = 0
        }
    }
}

  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effect array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element, Using data from appState plugin', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': 'item in $$appState.list',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length

        while (l--) {
            const item = rawCollection[l]
            if (l < to1 && l >= from1) {
                keys.add('' + l)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['undefined'] = __index
            scope['key'] = '' + __index
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.$appState.list, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['list',])

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        created[1].length = 0
        forloops[1] = null
        eff1 = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code using data from appState plugin'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effect array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element, Using data from nested state property', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': 'item in $content.data',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length

        while (l--) {
            const item = rawCollection[l]
            if (l < to1 && l >= from1) {
                keys.add('' + l)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['undefined'] = __index
            scope['key'] = '' + __index
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.content.data, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['data',])

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        created[1].length = 0
        forloops[1] = null
        eff1 = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code using data from nested state property'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effect array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element with a custom index key', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': '(item, customIndex) in $items',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length
        while (l--) {
            const item = rawCollection[l]
            const customIndex = l
            if (l < to1 && l >= from1) {
                keys.add('' + l)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['customIndex'] = __index
            scope['key'] = '' + __index
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.items, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['items',])

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        created[1].length = 0
        forloops[1] = null
        eff1 = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element with a key attribute', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': 'item in $items',
            key: '$item.id',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length
        while (l--) {
            const item = rawCollection[l]
            if (l < to1 && l >= from1) {
                keys.add('' + item.id)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['undefined'] = __index
            scope['key'] = '' + scope.item.id
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.items, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['items',])

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        created[1].length = 0
        forloops[1] = null
        eff1 = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on a Component with a key attribute and a custom index', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'ListItem',
            ':for': '(item, myIndex) in $items',
            key: '$item.id',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length

        while (l--) {
            const item = rawCollection[l]
            const myIndex = l
            if (l < to1 && l >= from1) {
                keys.add('' + item.id)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
                elms[2][key] && elms[2][key].destroy()
                elms[2][key] = null
                delete elms[2][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['myIndex'] = __index
            scope['key'] = '' + scope.item.id
            created.push(scope.key)
            cmps[1] = (context.components && context.components['ListItem']) || components['ListItem']
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            skips[1] = []
            if (typeof cmps[1] !== 'undefined') {
                for (let key in cmps[1][Symbol.for('config')].props) {
                    delete elementConfigs[1][cmps[1][Symbol.for('config')].props[key]]
                    skips[1].push(cmps[1][Symbol.for('config')].props[key])
                }
            }
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
            if (elms[2] === undefined) {
                elms[2] = {}
            }
            parent = elms[1][scope.key];
            props[2] = {}
            if (elms[2][scope.key] === undefined) {
                componentType = props[2]['is'] || 'ListItem'
                components[2]
                if (typeof componentType === 'string') {
                    components[2] = context.components && context.components[componentType] || components[componentType]
                    if (!components[2]) {
                        throw new Error('Component "ListItem" not found')
                    }
                } else if (typeof componentType === 'function' && componentType[Symbol.for('isComponent')] === true) {
                    components[2] = componentType
                }
                elms[2][scope.key] = components[2].call(null, { props: props[2] }, elms[1][scope.key], component)
                if (elms[2][scope.key][Symbol.for('slots')][0]) {
                    parent = elms[2][scope.key][Symbol.for('slots')][0]
                    slotComponent = elms[2][scope.key]
                    inSlot = true
                } else {
                    parent = elms[2][scope.key][Symbol.for('children')][0]
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.items, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['items',])

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null

        created[1].length = 0
        forloops[1] = null

        cmps[1] = null

        props[2] = null
        components[2] = null

        eff1 = null

        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with a simple for-loop on an Element with an automatic ref attribute', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        children: [
          {
            [Symbol.for('componentType')]: 'Element',
            ':for': 'item in $items',
            key: '$item.id',
            ref: 'myref',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}
    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elms[0].populate(elementConfigs[0])
    if (inSlot === true) {
        slotChildCounter -= 1
    }

    parent = elms[0]
    created[1] = []
    let from1
    let to1
    forloops[1] = (collection = [], elms, created) => {
        const rawCollection = getRaw(collection)
        const keys = new Set()
        let l = rawCollection.length

        const range = {} || {}
        from1 = range['from'] || 0
        to1 = 'to' in range ? range['to'] : rawCollection.length

        while (l--) {
            const item = rawCollection[l]
            if (l < to1 && l >= from1) {
                keys.add('' + item.id)
            }
        }

        let i = created.length
        while (i--) {
            if (keys.has(created[i]) === false) {
                const key = created[i]
                elms[1][key] && elms[1][key].destroy()
                elms[1][key] = null
                delete elms[1][key]
            }
        }
        created.length = 0
        const length = rawCollection.length
        const effects = []
        for (let __index = 0; __index < length; __index++) {
            if (__index < from1 || __index >= to1) continue
            const scope = Object.create(component)
            parent = elms[0]
            scope['item'] = rawCollection[__index]
            scope['undefined'] = __index
            scope['key'] = '' + scope.item.id
            scope['__ref'] = 'myref' + __index
            created.push(scope.key)
            parent = elms[0]
            if (elms[1] === undefined) {
                elms[1] = {}
            }
            elementConfigs[1] = {}
            if (elms[1][scope.key] === undefined) {
                elms[1][scope.key] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
            }
            elementConfigs[1]['ref'] = scope.__ref
            if (elms[1][scope.key].nodeId === undefined) {
                elms[1][scope.key].populate(elementConfigs[1])
                if (inSlot === true) {
                    slotChildCounter -= 1
                }
            }
        }
        return effects
    }

    let eff1 = () => {
        forloops[1](component.items, elms, created[1])
    }

    component[Symbol.for('effects')].push(eff1)

    effect(eff1, ['items',])

    return {
        elms,
        cleanup: () => {
            rootComponent = null
            propData = null
            slotComponent = null
            component = null
            parent = null

            created[1].length = 0
            forloops[1] = null

            eff1 = null

            cmps.length = 0
            elms.length = 0
            components.length = 0
            elementConfigs.length = 0
            forloops.length = 0
            props.length = 0
            skips.length = 0
        }
    }
}

  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an effects array with 1 function'
  )

  assert.end()
})

test('Generate code for a template with double $$ (i.e. referencing a Blits plugin)', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Text',
        ':content': "$$language.translate('hello')",
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []
    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)
    elementConfigs[0]['content'] = component.$language.translate('hello')
    elementConfigs[0]['__textnode'] = true
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('content', component.$language.translate('hello'))
  }
  `

  const actual = generator.call(scope, templateObject)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 1,
    'Generator should return an effects array with 1 item'
  )
  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return first render function with the correct code'
  )

  assert.end()
})

test('Generate code for a template with verification of dynamic attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        w: '$eWidth',
        h: '$eHeight',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []

    function propInComponent(prop, kind = "dynamic") {
        const property = prop.includes('.') ? prop.split('.')[0] : prop
        if (kind === 'reactive' || prop.includes('.') === false) {
            if (property in component === false) {
                Log.warn('Property ' + property + ' was accessed during render but is not defined on instance')
            }
        } else {
            const nestedKeys = prop.split('.')
            let base = component
            for (let i = 0; i < nestedKeys.length; i++) {
                if (base[nestedKeys[i]] === undefined) {
                    Log.warn('Property ' + nestedKeys.slice(0, i + 1).join('.') + ' was accessed during render but is not defined on instance')
                }
                base = base[nestedKeys[i]]
            }
        }
    }

    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    propInComponent('eWidth', 'dynamic')
    elementConfigs[0]['w'] = component.eWidth
    propInComponent('eHeight', 'dynamic')
    elementConfigs[0]['h'] = component.eHeight
    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const actual = generator.call(scope, templateObject, true)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )
  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 0,
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with verification of reactive attributes', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        ':w': '$eWidth',
        ':h': '$eHeight',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []

    function propInComponent(prop, kind = "dynamic") {
        const property = prop.includes('.') ? prop.split('.')[0] : prop
        if (kind === 'reactive' || prop.includes('.') === false) {
            if (property in component === false) {
                Log.warn('Property ' + property + ' was accessed during render but is not defined on instance')
            }
        } else {
            const nestedKeys = prop.split('.')
            let base = component
            for (let i = 0; i < nestedKeys.length; i++) {
                if (base[nestedKeys[i]] === undefined) {
                    Log.warn('Property ' + nestedKeys.slice(0, i + 1).join('.') + ' was accessed during render but is not defined on instance')
                }
                base = base[nestedKeys[i]]
            }
        }
    }

    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    propInComponent('eWidth', 'reactive')
    elementConfigs[0]['w'] = component.eWidth
    propInComponent('eHeight', 'reactive')
    elementConfigs[0]['h'] = component.eHeight

    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('w', component.eWidth)
  }
  `

  const expectedEffect2 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('h', component.eHeight)
 }
  `

  const actual = generator.call(scope, templateObject, true)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 2,
    'Generator should return an effects array with 2 item'
  )

  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function for the reactive eWidth attribute'
  )

  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return an effect function for the reactive eHeight attribute'
  )

  assert.end()
})

test('Generate code for a template with attribute values verified against a nested state object', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '$position.x',
        y: '$position.y',
        ':w': '$size.w',
        ':h': '$size.h',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []

    function propInComponent(prop, kind = "dynamic") {
        const property = prop.includes('.') ? prop.split('.')[0] : prop
        if (kind === 'reactive' || prop.includes('.') === false) {
            if (property in component === false) {
                Log.warn('Property ' + property + ' was accessed during render but is not defined on instance')
            }
        } else {
            const nestedKeys = prop.split('.')
            let base = component
            for (let i = 0; i < nestedKeys.length; i++) {
                if (base[nestedKeys[i]] === undefined) {
                    Log.warn('Property ' + nestedKeys.slice(0, i + 1).join('.') + ' was accessed during render but is not defined on instance')
                }
                base = base[nestedKeys[i]]
            }
        }
    }

    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    propInComponent('position.x', 'dynamic')
    elementConfigs[0]['x'] = component.position.x
    propInComponent('position.y', 'dynamic')
    elementConfigs[0]['y'] = component.position.y
    propInComponent('size', 'reactive')
    elementConfigs[0]['w'] = component.size.w
    propInComponent('size', 'reactive')
    elementConfigs[0]['h'] = component.size.h

    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('w', component.size.w)
  }
  `

  const expectedEffect2 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('h', component.size.h)
 }
  `

  const actual = generator.call(scope, templateObject, true)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 2,
    'Generator should return an effects array with 2 item'
  )

  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function for the reactive eWidth attribute'
  )

  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return an effect function for the reactive eHeight attribute'
  )

  assert.end()
})

test('Generate code for a template with verification of attributes with Math calculations', (assert) => {
  const templateObject = {
    children: [
      {
        [Symbol.for('componentType')]: 'Element',
        x: '$position.x * 100',
        y: '$position.y + 100',
        ':w': '$size.w * $correction ',
        ':h': '$size.h + $borderY',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent, component, context, components, effect, getRaw, Log) {
    const elms = []
    const elementConfigs = []
    const forloops = []
    const props = []
    const created = []
    const skips = []
    let componentType
    let rootComponent = component
    let propData
    let slotComponent
    let inSlot = false
    let slotChildCounter = 0
    let cmps = []

    function propInComponent(prop, kind = "dynamic") {
        const property = prop.includes('.') ? prop.split('.')[0] : prop
        if (kind === 'reactive' || prop.includes('.') === false) {
            if (property in component === false) {
                Log.warn('Property ' + property + ' was accessed during render but is not defined on instance')
            }
        } else {
            const nestedKeys = prop.split('.')
            let base = component
            for (let i = 0; i < nestedKeys.length; i++) {
                if (base[nestedKeys[i]] === undefined) {
                    Log.warn('Property ' + nestedKeys.slice(0, i + 1).join('.') + ' was accessed during render but is not defined on instance')
                }
                base = base[nestedKeys[i]]
            }
        }
    }

    elementConfigs[0] = {}

    elms[0] = this.element({ parent: parent || 'root' }, inSlot === true ? slotComponent : component)

    propInComponent('position.x', 'dynamic')
    elementConfigs[0]['x'] = component.position.x * 100
    propInComponent('position.y', 'dynamic')
    elementConfigs[0]['y'] = component.position.y + 100
    propInComponent('size', 'reactive')
    propInComponent('correction', 'reactive')
    elementConfigs[0]['w'] = component.size.w * component.correction
    propInComponent('size', 'reactive')
    propInComponent('borderY', 'reactive')
    elementConfigs[0]['h'] = component.size.h + component.borderY

    elms[0].populate(elementConfigs[0])

    if (inSlot === true) {
        slotChildCounter -= 1
    }

    return {
      elms,
      cleanup: () => {
        rootComponent = null
        propData = null
        slotComponent = null
        component = null
        parent = null
        cmps.length = 0
        elms.length = 0
        components.length = 0
        elementConfigs.length = 0
        forloops.length = 0
        props.length = 0
        skips.length = 0
      }
    }
  }`

  const expectedEffect1 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('w', component.size.w * component.correction)
  }
  `

  const expectedEffect2 = `
  function anonymous(component, elms, context, components, rootComponent, effect) {
    elms[0].set('h', component.size.h + component.borderY)
 }
  `

  const actual = generator.call(scope, templateObject, true)

  assert.equal(
    normalize(actual.render.toString()),
    normalize(expectedRender),
    'Generator should return a render function with the correct code'
  )

  assert.ok(
    Array.isArray(actual.effects) && actual.effects.length === 2,
    'Generator should return an effects array with 2 item'
  )

  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function for the reactive width attribute'
  )

  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return an effect function for the reactive height attribute'
  )

  assert.end()
})
