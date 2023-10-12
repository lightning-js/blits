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
  return str.replace(/[\n\s\t]/gi, '')
}

const componentConfigObject = {
  components: {},
}

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof generator

  assert.equal(actual, expected, 'Generator should be a function')
  assert.end()
})

test('Returns an object with a render function and a context object', (assert) => {
  const result = generator.call(componentConfigObject)
  const expected = 'object'
  const actual = typeof result

  assert.equal(actual, expected, 'Generator should return an object')
  assert.ok('render' in result, 'Generated object should have a render key')
  assert.ok('effects' in result, 'Generated object should have an effects key')
  assert.ok('context' in result, 'Generated object should have a context key')
  assert.end()
})

test('The render key is a function', (assert) => {
  const result = generator(componentConfigObject)
  const expected = 'function'
  const actual = typeof result.render

  assert.equal(actual, expected, 'Render key should return a function')
  assert.end()
})

test('The effects key is an array (of functions)', (assert) => {
  const result = generator()
  const actual = Array.isArray(result.effects)

  assert.ok(actual, 'Update key should return an Array')
  assert.end()
})

test('The contex key is an object', (assert) => {
  const result = generator()
  const expected = 'object'
  const actual = typeof result.context

  assert.equal(actual, expected, 'Context key should return an object')
  assert.end()
})

test('Generate render and effect code for an empty template', (assert) => {
  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []
      return elms
  }
  `

  const actual = generator()

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
        type: 'Component',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)
      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        children: [
          {
            type: 'Element',
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
    const elms = []

    elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
    const elementConfig1 = {}

    elementConfig1['type'] = "Component"

    elms[1].populate(elementConfig1)

    parent = elms[1]

    elms[2] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
    const elementConfig2 = {}

    elementConfig2['type'] = "Element"

    elms[2].populate(elementConfig2)

    return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        x: 10,
        y: 20,
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20

      elms[1].populate(elementConfig1)
      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            type: 'Element',
            w: 100,
            h: 300,
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20

      elms[1].populate(elementConfig1)

      parent = elms[1]

      elms[2] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig2 = {}

      elementConfig2['type'] = "Element"
      elementConfig2['w'] = 100
      elementConfig2['h'] = 300

      elms[2].populate(elementConfig2)

      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            type: 'Element',
            w: 100,
            h: 300,
            x: 0,
          },
          {
            type: 'Element',
            w: 100,
            h: 300,
            x: 50,
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20

      elms[1].populate(elementConfig1)

      parent = elms[1]

      elms[2] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig2 = {}

      elementConfig2['type'] = "Element"
      elementConfig2['w'] = 100
      elementConfig2['h'] = 300
      elementConfig2['x'] = 0

      elms[2].populate(elementConfig2)

      parent = elms[1]

      elms[3] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig3 = {}

      elementConfig3['type'] = "Element"
      elementConfig3['w'] = 100
      elementConfig3['h'] = 300
      elementConfig3['x'] = 50

      elms[3].populate(elementConfig3)

      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            type: 'Element',
            w: 100,
            h: 300,
            x: 0,
          },
          {
            type: 'Element',
            w: 100,
            h: 300,
            x: 50,
            children: [
              {
                type: 'Element',
                label: 'Hello',
              },
              {
                type: 'Element',
                label: 'World',
              },
            ],
          },
        ],
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20

      elms[1].populate(elementConfig1)

      parent = elms[1]

      elms[2] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig2 = {}

      elementConfig2['type'] = "Element"
      elementConfig2['w'] = 100
      elementConfig2['h'] = 300
      elementConfig2['x'] = 0

      elms[2].populate(elementConfig2)

      parent = elms[1]

      elms[3] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig3 = {}

      elementConfig3['type'] = "Element"
      elementConfig3['w'] = 100
      elementConfig3['h'] = 300
      elementConfig3['x'] = 50

      elms[3].populate(elementConfig3)

      parent = elms[3]

      elms[4] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig4 = {}

      elementConfig4['type'] = "Element"
      elementConfig4['label'] = "Hello"

      elms[4].populate(elementConfig4)

      parent = elms[3]

      elms[5] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig5 = {}

      elementConfig5['type'] = "Element"
      elementConfig5['label'] = "World"

      elms[5].populate(elementConfig5)

      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        x: 10,
        y: 20,
        ':w': '$foo',
        ':h': '$test',
        test: 'ok',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20
      elementConfig1['test'] = "ok"

      elms[1].populate(elementConfig1)

      return elms
  }
  `

  const expectedEffect1 = `
  function anonymous(component,elms,context) {
    elms[1].set('w', component.foo)
  }
  `

  const expectedEffect2 = `
  function anonymous(component,elms,context) {
    elms[1].set('h', component.test)
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        'my-Attribute': 'does it work?',
        x: 10,
        y: 20,
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['my-Attribute'] = "does it work?"
      elementConfig1['x'] = 10
      elementConfig1['y'] = 20

      elms[1].populate(elementConfig1)

      return elms
  }
  `

  const actual = generator(templateObject)

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
        type: 'Component',
        ':attribute1': '$foo * 2',
        ':attribute2': "$ok ? 'Yes' : 'No'",
        ':attribute3': "$text.split('').reverse().join('')",
        // ':attribute4': '$bar.foo * $blah.hello' => todo
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)

      return elms
  }
  `

  const expectedEffect1 = `
  function anonymous(component,elms,context) {
    elms[1].set('attribute1', component.foo * 2)
  }
  `

  const expectedEffect2 = `
  function anonymous(component,elms,context) {
    elms[1].set('attribute2', component.ok ? 'Yes' : 'No')
  }
  `

  const expectedEffect3 = `
  function anonymous(component,elms,context) {
    elms[1].set('attribute3', component.text.split('').reverse().join(''))
  }
  `

  const actual = generator(templateObject)

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
    'Generator should return first render function with the correct code'
  )
  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return second render function with the correct code'
  )
  assert.equal(
    normalize(actual.effects[2].toString()),
    normalize(expectedEffect3),
    'Generator should return third render function with the correct code'
  )

  assert.end()
})

test('Generate code for a template with custom components', (assert) => {
  const templateObject = {
    children: [
      {
        type: 'Component',
        children: [
          {
            type: 'Poster',
          },
          {
            type: 'Poster',
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
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)

      elms[2] = context['Poster'].call(null, context.props[0],elms[1], component)
      elms[3] = context['Poster'].call(null, context.props[1],elms[1], component)

      return elms
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
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with an unregistered custom component', (assert) => {
  const templateObject = {
    children: [
      {
        type: 'Component',
        children: [
          {
            type: 'Poster',
          },
          {
            type: 'Poster2',
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
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)

      elms[2] = context['Poster'].call(null, context.props[0],elms[1], component)

      parent = elms[1]

      elms[3] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig3 = {}

      elementConfig3['type'] = "Poster2"

      elms[3].populate(elementConfig3)

      return elms
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
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with custom components with arguments', (assert) => {
  const templateObject = {
    children: [
      {
        type: 'Component',
        children: [
          {
            type: 'Poster',
            x: 10,
          },
          {
            type: 'Poster',
            x: 100,
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
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)

      elms[2] = context['Poster'].call(null, context.props[0],elms[1], component)

      context.props[1].props.img = component.img

      elms[3] = context['Poster'].call(null, context.props[1],elms[1], component)

      return elms
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
    'Generator should return an empty effects array'
  )

  assert.end()
})

test('Generate code for a template with custom components with reactive props', (assert) => {
  const templateObject = {
    children: [
      {
        type: 'Component',
        children: [
          {
            type: 'Poster',
            x: 10,
            ':img': '$image',
          },
          {
            type: 'Poster',
            x: 100,
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
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"

      elms[1].populate(elementConfig1)

      context.props[0].props.img = component.image
      elms[2] = context['Poster'].call(null, context.props[0],elms[1], component)

      context.props[1].props.img = component.image
      elms[3] = context['Poster'].call(null, context.props[1],elms[1], component)

      return elms
  }
  `

  const expectedEffect1 = `
  function anonymous(component,elms,context) {
    elms[2].___props.img = component.image
  }
  `

  const expectedEffect2 = `
  function anonymous(component,elms,context) {
    elms[3].___props.img = component.image
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
    'Generator should return an effects array with 2 function'
  )
  assert.equal(
    normalize(actual.effects[0].toString()),
    normalize(expectedEffect1),
    'Generator should return an effect function that updates a prop on the first custom component'
  )

  assert.equal(
    normalize(actual.effects[1].toString()),
    normalize(expectedEffect2),
    'Generator should return an effect function that updates a prop on the second custom component'
  )

  assert.end()
})

test('Generate code for a template with a transition attributes', (assert) => {
  const templateObject = {
    children: [
      {
        type: 'Component',
        x: '{transition: $myX}',
        y: '{transition: {v: $myY, d: 600, p: 100}}',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      const elms = []

      elms[1] = this.element({componentId: component.___id, parentId: parent && parent.nodeId || 'root'})
      const elementConfig1 = {}

      elementConfig1['type'] = "Component"
      elementConfig1['x'] = "{transition: $myX}"
      elementConfig1['y'] = "{transition: {v: $myY, d: 600, p: 100}}"

      elms[1].populate(elementConfig1)

      return elms
  }
  `

  const actual = generator(templateObject)

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
