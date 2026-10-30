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
import Component from '../../component.js'
import symbols from '../symbols.js'
import { renderComponent } from '../../testing/index.js'

const cards = [{ id: 'one' }, { id: 'two' }]
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const Card = Component('LoopCard', { template: '<Element />' })
const keys = (fixture) => Object.keys(fixture.component[symbols.children][2] || {}).sort()
const createList = (source, config) =>
  renderComponent(
    Component('LoopList', {
      template: `<Element><LoopCard :for="card in $${source}" key="$card.id" /></Element>`,
      components: { LoopCard: Card },
      ...config,
    }),
    { props: config.props }
  )

const computedCards = {
  visibleCards() {
    return this.cards.filter(() => true)
  },
}

const checkUpdates = async (assert, fixture, setCards) => {
  try {
    assert.deepEqual(keys(fixture), [], 'Initially empty')
    await settle()
    setCards({ cards })
    assert.deepEqual(keys(fixture), ['one', 'two'], 'Array replacement creates children')
    fixture.component.cards.push({ id: 'three' })
    assert.deepEqual(keys(fixture), ['one', 'three', 'two'], 'Push creates another child')
    setCards({ cards: [] })
    assert.deepEqual(keys(fixture), [], 'Clearing removes children')
    fixture.component.cards.push(...cards)
    assert.deepEqual(keys(fixture), ['one', 'two'], 'Push into an empty array creates children')
  } finally {
    fixture.destroy()
  }
  assert.end()
}

test(':for updates an initially empty state array', (assert) => {
  const fixture = createList('cards', { state: () => ({ cards: [] }) })
  return checkUpdates(assert, fixture, fixture.setState)
})

test(':for updates an initially empty prop array', (assert) => {
  const fixture = createList('cards', { props: { cards: [] } })
  return checkUpdates(assert, fixture, fixture.setProps)
})

test(':for updates a computed array derived from initially empty state', (assert) => {
  const fixture = createList('visibleCards', {
    state: () => ({ cards: [] }),
    computed: computedCards,
  })
  return checkUpdates(assert, fixture, fixture.setState)
})

test(':for updates a computed array derived from an initially empty prop', (assert) => {
  const fixture = createList('visibleCards', {
    props: { cards: [] },
    computed: computedCards,
  })
  return checkUpdates(assert, fixture, fixture.setProps)
})

test(':for tracks dependencies discovered by a conditional computed', (assert) => {
  const fixture = createList('visibleCards', {
    state: () => ({ cards, show: false }),
    computed: {
      visibleCards() {
        return this.show ? this.cards : []
      },
    },
  })
  try {
    assert.deepEqual(keys(fixture), [], 'Initially hidden')
    fixture.component.show = true
    assert.deepEqual(keys(fixture), ['one', 'two'], 'Changing the condition creates children')
    fixture.component.cards = [{ id: 'three' }]
    assert.deepEqual(keys(fixture), ['three'], 'Newly discovered dependency remains reactive')
    fixture.component.show = false
    assert.deepEqual(keys(fixture), [], 'Changing the condition removes children')
  } finally {
    fixture.destroy()
  }
  assert.end()
})

test(':for renders an initially populated computed array', (assert) => {
  const fixture = createList('visibleCards', {
    state: () => ({ cards }),
    computed: {
      visibleCards() {
        return this.cards.filter(() => true)
      },
    },
  })
  try {
    assert.deepEqual(keys(fixture), ['one', 'two'], 'Computed children render at mount')
    fixture.component.cards = []
    assert.deepEqual(keys(fixture), [], 'Clearing removes the initial children')
  } finally {
    fixture.destroy()
  }
  assert.end()
})

test(':for preserves range tracking, filtering, and cleanup with chained computeds', (assert) => {
  let runs = 0
  const fixture = renderComponent(
    Component('ComputedLoopRange', {
      template: `<Element><Element :for="card in $visibleCards" key="$card.id"
      range="{from: 0, to: $to}" x="$x" /></Element>`,
      state: () => ({ cards: [], to: 1, x: 0 }),
      computed: {
        loadedCards() {
          return this.cards
        },
        visibleCards() {
          runs++
          return this.loadedCards.filter(() => true)
        },
      },
    })
  )
  const component = fixture.component
  const renderedKeys = () => Object.keys(component[symbols.children][1] || {}).sort()
  try {
    component.cards = cards
    assert.deepEqual(renderedKeys(), ['one'], 'Range limits the computed collection')
    assert.equal(runs, 2, 'One evaluation at mount and one on update')
    component.x = 10
    assert.equal(runs, 2, 'Loop body reads do not subscribe the loop')
    component.to = 2
    assert.deepEqual(renderedKeys(), ['one', 'two'], 'Range changes update the loop')
    assert.equal(runs, 3, 'Range update evaluates once')
  } finally {
    fixture.destroy()
  }
  component.cards = [{ id: 'three' }]
  assert.equal(runs, 3, 'Destroy unsubscribes computed dependencies')
  assert.end()
})
