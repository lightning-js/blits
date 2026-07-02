/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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
import Component from '../component.js'
import { renderComponent } from './index.js'

test('renderComponent snapshots a component with initial props', (assert) => {
  const Button = Component('Button', {
    template: `
      <Element w="320" h="80">
        <Text :content="$label" />
      </Element>
    `,
    props: {
      label: '',
    },
    state() {
      return {
        loaded: true,
      }
    },
  })

  const fixture = renderComponent(Button, {
    props: {
      label: 'Play',
    },
  })

  assert.deepEqual(
    fixture.snapshot(),
    {
      type: 'Component',
      name: 'Button',
      hasFocus: false,
      isHovered: false,
      attributes: {},
      props: {
        label: 'Play',
      },
      state: {
        loaded: true,
      },
      tree: {
        type: 'Element',
        attributes: {
          w: 320,
          h: 80,
        },
        children: [
          {
            type: 'Text',
            attributes: {
              content: 'Play',
            },
            children: [],
          },
        ],
      },
    },
    'Snapshot should contain component props, state, and evaluated template attributes'
  )

  fixture.destroy()
  assert.end()
})

test('renderComponent setProps updates reactive attributes in snapshots', (assert) => {
  const Button = Component('ReactiveButton', {
    template: `
      <Element :x="$x">
        <Text :content="$label" />
      </Element>
    `,
    props: {
      label: '',
      x: 0,
    },
    state() {
      return {
        count: 1,
      }
    },
  })

  const fixture = renderComponent(Button, {
    props: {
      label: 'Play',
      x: 20,
    },
  })

  fixture.setProps({
    label: 'Pause',
    x: 40,
  })

  assert.deepEqual(
    fixture.snapshot(),
    {
      type: 'Component',
      name: 'ReactiveButton',
      hasFocus: false,
      isHovered: false,
      attributes: {},
      props: {
        label: 'Pause',
        x: 40,
      },
      state: {
        count: 1,
      },
      tree: {
        type: 'Element',
        attributes: {
          x: 40,
        },
        children: [
          {
            type: 'Text',
            attributes: {
              content: 'Pause',
            },
            children: [],
          },
        ],
      },
    },
    'Snapshot should reflect prop-driven reactive template updates'
  )

  fixture.destroy()
  assert.end()
})

test('renderComponent setState updates state and reactive attributes in snapshots', (assert) => {
  const Message = Component('StateMessage', {
    template: `
      <Element>
        <Text :content="$message" :x="$x" />
      </Element>
    `,
    state() {
      return {
        message: 'Loading',
        x: 10,
      }
    },
  })

  const fixture = renderComponent(Message)

  fixture.setState({
    message: 'Ready',
    x: 20,
  })

  assert.deepEqual(
    fixture.snapshot().state,
    {
      message: 'Ready',
      x: 20,
    },
    'Snapshot should contain the updated state'
  )
  assert.deepEqual(
    fixture.snapshot().tree.children[0].attributes,
    {
      content: 'Ready',
      x: 20,
    },
    'State updates should update the rendered tree'
  )

  fixture.destroy()
  assert.end()
})

test('renderComponent finds nodes by inspector data', (assert) => {
  const Menu = Component('InspectableMenu', {
    template: `
      <Element inspector-data="{testId: 'menu', role: 'menu'}">
        <Text content="Menu" inspector-data="{testId: 'menu-title'}" />
        <Element inspector-data="{role: 'menu-item'}" />
        <Element inspector-data="{role: 'menu-item'}" />
      </Element>
    `,
  })

  const fixture = renderComponent(Menu)

  assert.equal(
    fixture.findByData('testId', 'menu-title').attributes.content,
    'Menu',
    'findByData should return the first node with matching inspector data'
  )
  assert.equal(
    fixture.findAllByData('role', 'menu-item').length,
    2,
    'findAllByData should return all matching nodes'
  )
  assert.equal(fixture.findByData('testId', 'missing'), null, 'findByData should return null')
  assert.deepEqual(fixture.findAllByData('role', 'missing'), [], 'findAllByData should return []')

  fixture.destroy()
  assert.end()
})

test('renderComponent snapshots nested component attributes and props separately', (assert) => {
  const Card = Component('Card', {
    template: `
      <Element>
        <Text :content="$title" />
      </Element>
    `,
    props: {
      title: '',
      kind: '',
    },
    state() {
      return {
        imageLoaded: false,
      }
    },
  })

  const Shelf = Component('Shelf', {
    template: `
      <Element>
        <Card :x="$cardX" y="20" :title="$title" kind="poster" />
      </Element>
    `,
    props: {
      cardX: 0,
      title: '',
    },
    state() {
      return {
        selectedIndex: 0,
      }
    },
    components: {
      Card,
    },
  })

  const fixture = renderComponent(Shelf, {
    props: {
      cardX: 100,
      title: 'Dune',
    },
  })

  assert.deepEqual(
    fixture.snapshot(),
    {
      type: 'Component',
      name: 'Shelf',
      hasFocus: false,
      isHovered: false,
      attributes: {},
      props: {
        cardX: 100,
        title: 'Dune',
      },
      state: {
        selectedIndex: 0,
      },
      tree: {
        type: 'Element',
        attributes: {},
        children: [
          {
            type: 'Component',
            name: 'Card',
            hasFocus: false,
            isHovered: false,
            attributes: {
              x: 100,
              y: 20,
              data: {
                'blits-componentType': 'Card',
              },
            },
            props: {
              title: 'Dune',
              kind: 'poster',
            },
            state: {
              imageLoaded: false,
            },
            tree: {
              type: 'Element',
              attributes: {},
              children: [
                {
                  type: 'Text',
                  attributes: {
                    content: 'Dune',
                  },
                  children: [],
                },
              ],
            },
          },
        ],
      },
    },
    'Nested component snapshots should include state and separate holder attributes from props'
  )

  fixture.setProps({
    cardX: 140,
    title: 'Blade Runner',
  })

  const snapshot = fixture.snapshot()
  const cardSnapshot = snapshot.tree.children[0]
  assert.equal(cardSnapshot.attributes.x, 140, 'Holder attributes should update')
  assert.equal(cardSnapshot.props.title, 'Blade Runner', 'Child component props should update')
  assert.equal(
    cardSnapshot.tree.children[0].attributes.content,
    'Blade Runner',
    'Child component output should update from changed props'
  )
  assert.equal('$hasFocus' in snapshot.state, false, 'Built-in focus state should be omitted')
  assert.equal('$isHovered' in snapshot.state, false, 'Built-in hover state should be omitted')

  fixture.destroy()
  assert.end()
})

test('renderComponent can focus and unfocus the mounted component', async (assert) => {
  const Button = Component('FocusableButton', {
    template: `
      <Element>
        <Text content="Button" />
      </Element>
    `,
  })

  const fixture = renderComponent(Button)

  assert.equal(fixture.component.$hasFocus, false, 'Component should start unfocused')

  await fixture.focus()

  assert.equal(fixture.component.$hasFocus, true, 'Component should be focused')
  assert.equal(fixture.snapshot().hasFocus, true, 'Snapshot should expose focus state')

  fixture.unfocus()

  assert.equal(fixture.component.$hasFocus, false, 'Component should be unfocused')
  assert.equal(fixture.snapshot().hasFocus, false, 'Snapshot should expose unfocused state')

  fixture.destroy()
  assert.end()
})

test('renderComponent routes input through the focused component', async (assert) => {
  const Button = Component('InputButton', {
    template: `
      <Element>
        <Text :content="$count" />
      </Element>
    `,
    state() {
      return {
        count: 0,
        eventType: '',
      }
    },
    input: {
      enter(event) {
        this.count++
        this.eventType = event.type
      },
    },
  })

  const fixture = renderComponent(Button)

  assert.equal(fixture.input('enter'), false, 'Input should not run before focus is set')
  assert.equal(fixture.snapshot().state.count, 0, 'State should not update without focus')

  await fixture.focus()

  assert.equal(fixture.input('enter'), true, 'Input should run when the component is focused')
  assert.equal(fixture.snapshot().state.count, 1, 'Input should update component state')
  assert.equal(
    fixture.snapshot().tree.children[0].attributes.content,
    1,
    'Input should update the rendered tree'
  )
  assert.equal(fixture.snapshot().state.eventType, 'keydown', 'Generated event should be passed in')

  fixture.destroy()
  assert.end()
})

test('renderComponent input accepts a custom keyboard event', async (assert) => {
  const Button = Component('CustomEventButton', {
    template: '<Element />',
    state() {
      return {
        keyCode: 0,
      }
    },
    input: {
      enter(event) {
        this.keyCode = event.keyCode
      },
    },
  })

  const fixture = renderComponent(Button)
  const event = fixture.createKeyboardEvent('enter', {
    key: 'Enter',
    keyCode: 13,
  })

  await fixture.focus()
  fixture.input('enter', event)

  assert.equal(fixture.snapshot().state.keyCode, 13, 'Custom event should be passed to handler')

  fixture.destroy()
  assert.end()
})
