/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

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
  assert.ok('children' in result, 'Parser should return an object with a children key')
  assert.ok(Array.isArray(result.children), 'Children key returned by parser should be an array')
  assert.end()
})

test('Parse simple single tag', (assert) => {
  const template = '<Component></Component>'

  const expected = {
    children: [
      {
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
        type: 'Component',
        children: [
          {
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

test('Parse simple single tag with static attributes', (assert) => {
  const template = '<Component x="10" y="20"></Component>'

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
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
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and 2 nested tags with attributes', (assert) => {
  const template = `
    <Component x="10" y="20">
      <Element w="100" h="300" x="0"></Element>
      <Element w="100" h="300" x="50"></Element>
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '0',
          },
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '50',
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
      <Element w="100" h="300" x="50">
        <Button label="Hello"></Button>
        <Button label="World"></Button>
      </Element>
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '0',
          },
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '50',
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
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse simple single tag with dynamic attributes', (assert) => {
  const template = '<Component x="$x" y="$y"></Component>'

  const expected = {
    children: [
      {
        type: 'Component',
        x: '$x',
        y: '$y',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse tag with attributes and reactive attributes', (assert) => {
  const template = '<Component x="10" y="20" :w="foo" :h="test" test="ok"></Component>'

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        ':w': 'foo',
        ':h': 'test',
        test: 'ok',
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
        type: 'Component',
        'my-Attribute': 'this',
        x: '10',
        y: '20',
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
        type: 'Component',
        children: [
          {
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
        type: 'Component',
        children: [
          {
            type: 'Input',
          },
          {
            type: 'Input',
          },
          {
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

test('Parse attributes which values have spaces in it', (assert) => {
  const template = '<Component attribute="I have spaces"></Component>'

  const expected = {
    children: [
      {
        type: 'Component',
        attribute: 'I have spaces',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse attributes with an expression in it', (assert) => {
  const template = `
    <Component
      :attribute1="$foo * 2"
      :attribute2="$ok ? 'Yes' : 'No'"
      :attribute3="$text.split('').reverse().join('')"
      :attribute4="$size > 100 ? 110 : $size"
      :attribute5="Math.min($size, 100)"
    />`

  const expected = {
    children: [
      {
        type: 'Component',
        ':attribute1': '$foo * 2',
        ':attribute2': "$ok ? 'Yes' : 'No'",
        ':attribute3': "$text.split('').reverse().join('')",
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with commented tag (and skip it)', (assert) => {
  const template = `
    <Component x="10" y="20">
      <!--Element w="100" h="300" x="0"></Element-->
      <Element w="100" h="300" x="50">
        <Button label="Hello"></Button>
        <!--Button label="World"></Button-->
      </Element>
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '50',
            children: [
              {
                type: 'Button',
                label: 'Hello',
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

test('Parse template with comment spanned across multiple tags (and skip it)', (assert) => {
  const template = `
    <Component x="10" y="20">
      <!--Element w="100" h="300" x="0"></Element-->
      <Element w="100" h="300" x="50">
        <!--Button label="Hello"></Button>
        <Button label="World"></Button-->
      </Element>
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '50',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with enclosing comment (and skip it)', (assert) => {
  const template = `
    <Component x="10" y="20">
      <Element w="100" h="300" x="0"></Element>
      <Element w="100" h="300" x="50">
        <!--
          <Button label="Hello"></Button>
          <Button label="World"></Button>
        -->
      </Element>
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        x: '10',
        y: '20',
        children: [
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '0',
          },
          {
            type: 'Element',
            w: '100',
            h: '300',
            x: '50',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with for loop', (assert) => {
  const template = `
    <List>
      <ListItem :for="item in $items" />
    </List>`

  const expected = {
    children: [
      {
        type: 'List',
        children: [
          {
            type: 'ListItem',
            ':for': 'item in $items',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a conditional (if-statement)', (assert) => {
  const template = `
    <Component :if="$loggedIn === true">
      <Text value="Welcome" />
      <Avatar :user="$user" />
    </Component>`

  const expected = {
    children: [
      {
        type: 'Component',
        ':if': '$loggedIn === true',
        children: [
          {
            type: 'Text',
            value: 'Welcome',
          },
          {
            type: 'Avatar',
            ':user': '$user',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a visibility toggle (show-statement)', (assert) => {
  const template = `
    <Poster w="200" h="500">
      <Label :text="$text" />
      <Image src="$image" />
      <Star :show="$favorited === true" />
    </Poster>`

  const expected = {
    children: [
      {
        type: 'Poster',
        w: '200',
        h: '500',
        children: [
          {
            type: 'Label',
            ':text': '$text',
          },
          {
            type: 'Image',
            src: '$image',
          },
          {
            type: 'Star',
            ':show': '$favorited === true',
          },
        ],
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a nameless tag', (assert) => {
  const template = `
    <>
      <Component x="50" y="20">
        <Component w="100" h="20" />
      </Component>
    </>`

  const expected = {
    children: [
      {
        type: null,
        children: [
          {
            type: 'Component',
            x: '50',
            y: '20',
            children: [
              {
                type: 'Component',
                w: '100',
                h: '20',
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

test('Parse template with a nameless tag but with arguments', (assert) => {
  const template = `
    <x="100" y="200">
      <x="50" y="20">
        <Component w="100" h="20" />
      </>
    </>`

  const expected = {
    children: [
      {
        type: null,
        x: '100',
        y: '200',
        children: [
          {
            type: null,
            x: '50',
            y: '20',
            children: [
              {
                type: 'Component',
                w: '100',
                h: '20',
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

test('Parse template with a transition argument (single value)', (assert) => {
  const template = `
    <Element x.transition="$offset" y="200">
    </Element>`

  const expected = {
    children: [
      {
        type: 'Element',
        x: '{transition: $offset}',
        y: '200',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a transition argument (object)', (assert) => {
  const template = `
    <Element :x.transition="{v: $offset, d: 2000}" y="200">
    </Element>`

  const expected = {
    children: [
      {
        type: 'Element',
        ':x': '{transition: {v: $offset, d: 2000}}',
        y: '200',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a different modifier', (assert) => {
  const template = `
    <Element x.modifier="ok" y="200">
    </Element>`

  const expected = {
    children: [
      {
        type: 'Element',
        x: '{modifier: ok}',
        y: '200',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})

test('Parse template with a full transition object (without the transition modifier)', (assert) => {
  const template = `
    <Element :x="{transition: {v: $offset, d: 2000, p: 100}}" y="200">
    </Element>`

  const expected = {
    children: [
      {
        type: 'Element',
        ':x': '{transition: {v: $offset, d: 2000, p: 100}}',
        y: '200',
      },
    ],
  }
  const actual = parser(template)

  assert.deepEqual(actual, expected, 'Parser should return object representation of template')
  assert.end()
})
