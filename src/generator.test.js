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

  assert.equal(actual, expected, 'Generator should return an object')
  assert.ok('render' in result, 'Generator object should have a render key')
  assert.ok('update' in result, 'Generator object should have a update key')
  assert.ok('context' in result, 'Generator object should have a context key')
  assert.end()
})

test('The render key is a function', (assert) => {
  const result = generator()
  const expected = 'function'
  const actual = typeof result.render

  assert.equal(actual, expected, 'Render key should return a function')
  assert.end()
})

test('The update key is a function', (assert) => {
  const result = generator()
  const expected = 'function'
  const actual = typeof result.update

  assert.equal(actual, expected, 'Update key should return a function')
  assert.end()
})

test('The contex key is an object', (assert) => {
  const result = generator()
  const expected = 'object'
  const actual = typeof result.context

  assert.equal(actual, expected, 'Context key should return an object')
  assert.end()
})

test('Generate render and update code for an empty template', (assert) => {
  const expectedRender = `
  function anonymous(parent,component,context) {
      var els = []
      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `
  const actual = generator()
  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a update function with the correct code')
  assert.end()

})


test('Generate render and update code for a template with a single simple element', (assert) => {

  const templateObject = {
    children: [
      {
        type: 'Component',
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a update function with the correct code')
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"

      els[2] = this.createElement()
      els[1].childList ? els[1].childList.add(els[2]) : els[1].add(els[2])

      els[2]['type'] = "Element"

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a update function with the correct code')
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a update function with the correct code')
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      els[2] = this.createElement()
      els[1].childList ? els[1].childList.add(els[2]) : els[1].add(els[2])

      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `


  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a render function with the correct code')
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      els[2] = this.createElement()
      els[1].childList ? els[1].childList.add(els[2]) : els[1].add(els[2])

      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300
      els[2]['x'] = 0

      els[3] = this.createElement()
      els[1].childList ? els[1].childList.add(els[3]) : els[1].add(els[3])

      els[3]['type'] = "Element"
      els[3]['w'] = 100
      els[3]['h'] = 300
      els[3]['x'] = 50

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a render function with the correct code')
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
                type: 'Button',
                label: 'Hello',
              },
              {
                type: 'Button',
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      els[2] = this.createElement()
      els[1].childList ? els[1].childList.add(els[2]) : els[1].add(els[2])

      els[2]['type'] = "Element"
      els[2]['w'] = 100
      els[2]['h'] = 300
      els[2]['x'] = 0

      els[3] = this.createElement()
      els[1].childList ? els[1].childList.add(els[3]) : els[1].add(els[3])

      els[3]['type'] = "Element"
      els[3]['w'] = 100
      els[3]['h'] = 300
      els[3]['x'] = 50

      els[4] = this.createElement()
      els[3].childList ? els[3].childList.add(els[4]) : els[3].add(els[4])

      els[4]['type'] = "Button"
      els[4]['label'] = "Hello"

      els[5] = this.createElement()
      els[3].childList ? els[3].childList.add(els[5]) : els[3].add(els[5])

      els[5]['type'] = "Button"
      els[5]['label'] = "World"

      return els
  }
  `

  const expectedUpdate = `
  function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a render function with the correct code')
  assert.end()

})


test('Generate code for a template with simple dynamic attributes', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
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
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['x'] = 10
      els[1]['y'] = 20

      els[1]['test'] = "ok"

      return els
  }`

  const expectedUpdate = `function anonymous(component,els,context) {
    els[1]['w'] = component.state.foo
    els[1]['h'] = component.state.test
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a update function with the correct code')
  assert.end()

})


test('Generate code for a template with an attribute with a dash', (assert) => {

  const templateObject = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        'my-Attribute': 'does it work?',
        x: 10,
        y: 20,
      },
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['ref'] = "Component"
      els[1]['type'] = "Component"
      els[1]['my-Attribute'] = "does it work?"
      els[1]['x'] = 10
      els[1]['y'] = 20

      return els
  }`

  const expectedUpdate = `function anonymous(component,els,context) {
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a render function with the correct code')

  assert.end()
})

test('Generate code for a template with dynamic attributes with code to be evaluated', (assert) => {

  const templateObject = {
    children: [
      {
        type: 'Component',
        ':attribute1': '$foo * 2',
        ':attribute2': '$ok ? \'Yes\' : \'No\'',
        ':attribute3': '$text.split(\'\').reverse().join(\'\')',
        // ':attribute4': '$bar.foo * $blah.hello' => todo
      }
    ],
  }

  const expectedRender = `
  function anonymous(parent,component,context) {
      var els = []

      els[1] = this.createElement()
      parent.childList ? parent.childList.add(els[1]) : parent.add(els[1])

      els[1]['type'] = "Component"

      return els
  }`

  const expectedUpdate = `function anonymous(component,els,context) {
    els[1]['attribute1'] = component.state.foo * 2
    els[1]['attribute2'] = component.state.ok ? 'Yes' : 'No'
    els[1]['attribute3'] = component.state.text.split(\'\').reverse().join(\'\')
  }
  `

  const actual = generator(templateObject)

  assert.equal(normalize(actual.render.toString()), normalize(expectedRender), 'Generator should return a render function with the correct code')
  assert.equal(normalize(actual.update.toString()), normalize(expectedUpdate), 'Generator should return a render function with the correct code')

  assert.end()
})
