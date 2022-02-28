import test from 'tape'
import generator from './generator.js'

const normalize = (str) => {
  return str.replace(/[\n\s\t]/gi, '')
}

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof generator

  assert.equal(actual, expected, 'Generator should be a function')
  assert.end()
})

test('Returns an object with a render function and a context object', (assert) => {
  const result = generator()
  const expected = 'object'
  const actual = typeof result

  assert.equal(actual, expected, 'Generator should return object')
  assert.ok('render' in result, 'Generator object should have a render key')
  assert.ok('context' in result, 'Generator object should have a context key')
  assert.end()
})

test('Render returns a function', (assert) => {
  const result = generator()
  const expected = 'function'
  const actual = typeof result.render

  assert.equal(actual, expected, 'Render key should return a function')
  assert.end()
})

test('Context returns an object', (assert) => {
  const result = generator()
  const expected = 'object'
  const actual = typeof result.context

  assert.equal(actual, expected, 'Context key should return an object')
  assert.end()
})

test('Generate code for an empty template', (assert) => {
  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []
      return els
  }
  `
  const actual = generator().render.toString()
  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with a single simple element', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})

test('Generate code for a template with a simple element and a simple nested element', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        children: [
          {
            ref: 'Element',
            type: 'Element',
          },
        ],
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"

      if(!els[2]) {
        els[2] = this.createElement()
        els[1].childList.add(els[2])
      }

      els[2]['ref'] = "Element"
      els[2]['type'] = "Element"

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with a single element with attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with attributes and a nested element with attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            ref: 'Element',
            type: 'Element',
            w: 100,
            h: 300,
          },
        ],
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      if(!els[2]) {
        els[2] = this.createElement()
        els[1].childList.add(els[2])
      }

      els[2]['ref'] = "Element"
      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with attributes and 2 nested elements with attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            ref: 'Element',
            type: 'Element',
            w: 100,
            h: 300,
            x: 0,
          },
          {
            ref: 'Element2',
            type: 'Element',
            w: 100,
            h: 300,
            x: 50,
          },
        ],
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      if(!els[2]) {
        els[2] = this.createElement()
        els[1].childList.add(els[2])
      }

      els[2]['ref'] = "Element"
      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300
      els[2]['x'] = 0

      if(!els[3]) {
        els[3] = this.createElement()
        els[1].childList.add(els[3])
      }

      els[3]['ref'] = "Element2"
      els[3]['type'] = "Element"
      els[3]['w'] = 100
      els[3]['h'] = 300
      els[3]['x'] = 50

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with attributes and deep nested elements with attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
        children: [
          {
            ref: 'Element',
            type: 'Element',
            w: 100,
            h: 300,
            x: 0,
          },
          {
            ref: 'Element2',
            type: 'Element',
            w: 100,
            h: 300,
            x: 50,
            children: [
              {
                ref: 'Button',
                type: 'Button',
                label: 'Hello',
              },
              {
                ref: 'Button2',
                type: 'Button',
                label: 'World',
              },
            ],
          },
        ],
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      if(!els[2]) {
        els[2] = this.createElement()
        els[1].childList.add(els[2])
      }

      els[2]['ref'] = "Element"
      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300
      els[2]['x'] = 0

      if(!els[3]) {
        els[3] = this.createElement()
        els[1].childList.add(els[3])
      }

      els[3]['ref'] = "Element2"
      els[3]['type'] = "Element"
      els[3]['w'] = 100
      els[3]['h'] = 300
      els[3]['x'] = 50


      if(!els[4]) {
        els[4] = this.createElement()
        els[3].childList.add(els[4])
      }

      els[4]['ref'] = "Button"
      els[4]['type'] = "Button"
      els[4]['label'] = "Hello"

      if(!els[5]) {
        els[5] = this.createElement()
        els[3].childList.add(els[5])
      }

      els[5]['ref'] = "Button2"
      els[5]['type'] = "Button"
      els[5]['label'] = "World"

      return els
  }
  `

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with dynamic attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
        'bind:w': 'foo',
        ':h': 'test',
        test: 'ok',
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      els[1]['w'] = state.foo
      els[1]['h'] = state.test

      els[1]['test'] = "ok"

      return els
  }`

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')
  assert.end()

})


test('Generate code for a template with an attribute with a dash', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        'my-Attribute': 'this',
        x: 10,
        y: 20,
      },
    ],
  }

  const expected = `
  function anonymous(parent,state,els,context) {
      if(!els) var els = []

      if(!els[1]) {
        els[1] = this.createElement()
        parent.childList.add(els[1])
      }

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['my-Attribute'] = "this"
      els[1]['x'] = 10
      els[1]['y'] = 20

      return els
  }`

  const actual = generator(templateObject).render.toString()

  assert.equal(normalize(actual), normalize(expected), 'Generator should return a function with the correct code')

  assert.end()
})



test('Generate code for a template with a color attribute', (assert) => {
  assert.end()
})
