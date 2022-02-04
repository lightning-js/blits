import test from 'tape'
import parser from './parser.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof parser

  assert.equal(actual, expected, 'Parser should be a function')
  assert.end()
})

test('Returns an object', (assert) => {
  const result = parser()
  const expected = 'object'
  const actual = typeof result

  assert.equal(actual, expected, 'Parser should return an object')
  assert.notOk(Array.isArray(result), 'Parser should return an array')
  assert.end()
})

test('Parse simple single tag', (assert) => {
  const template = '<Component></Component>'

  const expected = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse simple tag and simple nested tag', (assert) => {
  const template = '<Component><Element></Element></Component>'

  const expected = {
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
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse simple single tag with attributes', (assert) => {
  const template = '<Component x="10" y="20"></Component>'

  const expected = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        x: 10,
        y: 20,
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and nested tag with attributes', (assert) => {
  const template = '<Component x="10" y="20"><Element w="100" h="300"></Element></Component>'

  const expected = {
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
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and 2 nested tag with attributes', (assert) => {
  const template = `
    <Component x="10" y="20">
      <Element w="100" h="300" x="0"></Element>
      <Element2 w="100" h="300" x="50"></Element>
    </Component>`

  const expected = {
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
            type: 'Element2',
            w: 100,
            h: 300,
            x: 50,
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and deep nested tag with attributes', (assert) => {
  const template = `
    <Component x="10" y="20">
      <Element w="100" h="300" x="0"></Element>
      <Element2 w="100" h="300" x="50">
        <Button label="Hello"></Button>
        <Button2 label="World"></Button>
      </Element>
    </Component>`

  const expected = {
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
            type: 'Element2',
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
                type: 'Button2',
                label: 'World',
              },
            ],
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and dynamic attributes', (assert) => {

  const template = '<Component x="10" y="20" bind:w="foo" :h="test" test="ok"></Component>'

  const expected = {
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
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse simple single tag with custom ref', (assert) => {
  const template = '<Component x="10" y="20" ref="MyReference"></Component>'

  const expected = {
    children: [
      {
        ref: 'MyReference',
        type: 'Component',
        x: 10,
        y: 20,
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test("Parse simple single tag where one of the attributes has a dash in it's name", (assert) => {
  const template = '<Component x="10" y="20" my-Attribute="this"></Component>'

  const expected = {
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
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

// test('Parse tag with color attribute', assert => {

//   const template = `<Component  color="0xff5aaade"></Component>`

//   const expected = {
//     children: [
//       {
//         ref: 'Component',
//         type: 'Component',
//         color: 0xff5aaade
//       }
//     ]
//   }
//   const actual = parser(template)

//   assert.deepEqual(actual, expected, 'Parser should return object representation of template')
//   assert.end()
// })

test('Parse self closing tag', (assert) => {
  const template = '<Component />'

  const expected = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse nested self closing tag', (assert) => {
  const template = '<Component><Input /></Component>'

  const expected = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        children: [
          {
            ref: 'Input',
            type: 'Input',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse multiple nested self closing tags', (assert) => {
  const template = '<Component><Input /><Input /><Input /></Component>'

  const expected = {
    children: [
      {
        ref: 'Component',
        type: 'Component',
        children: [
          {
            ref: 'Input',
            type: 'Input',
          },
          {
            ref: 'Input',
            type: 'Input',
          },
          {
            ref: 'Input',
            type: 'Input',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})
