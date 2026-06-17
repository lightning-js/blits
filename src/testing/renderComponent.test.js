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
  })

  const fixture = renderComponent(Button, {
    props: {
      label: 'Play',
    },
  })

  assert.deepEqual(
    fixture.snapshot(),
    {
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
    'Snapshot should contain the evaluated template attributes'
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
    'Snapshot should reflect prop-driven reactive template updates'
  )

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
      type: 'Element',
      attributes: {},
      children: [
        {
          type: 'Component',
          name: 'Card',
          attributes: {
            x: 100,
            y: 20,
          },
          props: {
            title: 'Dune',
            kind: 'poster',
          },
          children: [
            {
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
          ],
        },
      ],
    },
    'Nested component snapshots should separate holder attributes from component props'
  )

  fixture.setProps({
    cardX: 140,
    title: 'Blade Runner',
  })

  const snapshot = fixture.snapshot()
  assert.equal(snapshot.children[0].attributes.x, 140, 'Holder attributes should update')
  assert.equal(
    snapshot.children[0].props.title,
    'Blade Runner',
    'Child component props should update'
  )
  assert.equal(
    snapshot.children[0].children[0].children[0].attributes.content,
    'Blade Runner',
    'Child component output should update from changed props'
  )

  fixture.destroy()
  assert.end()
})
