/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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

import { test } from 'tap'
import Focus from './focus.js'
import { initLog } from './lib/log.js'

initLog()

test('Focus type', (assert) => {
  const expected = 'object'
  const actual = typeof Focus

  assert.equal(actual, expected, 'Component should be a function')
  assert.end()
})

test('Public methods on focus object', (assert) => {
  assert.equal(true, typeof Focus.get === 'function', 'Focus should have a get method')
  assert.equal(true, typeof Focus.set === 'function', 'Focus should have a set method')
  assert.equal(true, typeof Focus.input === 'function', 'Focus should have an input method')

  assert.end()
})

test('Setting focus', (assert) => {
  const component = {
    componentId: 'comp1',
    lifecycle: {
      state: 'init',
    },
  }

  Focus.set(component)

  setTimeout(() => {
    assert.equal(Focus.get(), component, 'Focused component should be set as new focused component')
    assert.equal(
      component.lifecycle.state,
      'focus',
      'Focused component should have the lifecycle state "focus"'
    )
    assert.end()
  })
})

test('Focussing along focus path', (assert) => {
  const parent = {
    componentId: 'parent',
    lifecycle: {
      state: 'init',
    },
  }
  const component = {
    componentId: 'comp1',
    parent,
    lifecycle: {
      state: 'init',
    },
  }

  Focus.set(component)

  setTimeout(() => {
    assert.equal(
      component.lifecycle.state,
      'focus',
      'Focused component should have the lifecycle state "focus"'
    )

    assert.equal(
      parent.lifecycle.state,
      'focus',
      'Parent of focused component should also have the lifecycle state "focus" (as part of the focus chain)'
    )

    assert.end()
  })
})

test('Unfocus focus chain', (assert) => {
  const parent = {
    componentId: 'parent',
    lifecycle: {
      state: 'init',
    },
  }
  const component = {
    componentId: 'comp1',
    parent,
    lifecycle: {
      state: 'init',
    },
  }

  const otherComponent = {
    componentId: 'other',
    lifecycle: {
      state: 'init',
    },
  }

  Focus.set(component)

  setTimeout(() => {
    assert.equal(
      component.lifecycle.state,
      'focus',
      'Focused component should have the lifecycle state "focus"'
    )

    Focus.set(otherComponent)

    setTimeout(() => {
      assert.equal(
        otherComponent.lifecycle.state,
        'focus',
        'Focused component should have the lifecycle state "focus"'
      )

      assert.equal(
        component.lifecycle.state,
        'unfocus',
        'Previously focused component should have the lifecycle state "focus"'
      )

      assert.equal(
        parent.lifecycle.state,
        'unfocus',
        'Parent of previously focused component should also have the lifecycle state "unfocus" (as part of the focus chain)'
      )
      assert.end()
    })
  })
})

test('Unfocus partial focus chain', (assert) => {
  const grandparent = {
    componentId: 'grandparent',
    lifecycle: {
      state: 'init',
    },
  }
  const parent = {
    componentId: 'parent',
    parent: grandparent,
    lifecycle: {
      state: 'init',
    },
  }
  const component = {
    componentId: 'comp1',
    parent,
    lifecycle: {
      state: 'init',
    },
  }

  const otherComponent = {
    componentId: 'other',
    parent: grandparent,
    lifecycle: {
      state: 'init',
    },
  }

  Focus.set(component)

  setTimeout(() => {
    assert.equal(
      component.lifecycle.state,
      'focus',
      'Focused component should have the lifecycle state "focus"'
    )

    Focus.set(otherComponent)

    setTimeout(() => {
      assert.equal(
        otherComponent.lifecycle.state,
        'focus',
        'Focused component should have the lifecycle state "focus"'
      )

      assert.equal(
        component.lifecycle.state,
        'unfocus',
        'Previously focused component should have the lifecycle state "focus"'
      )

      assert.equal(
        grandparent.lifecycle.state,
        'focus',
        'Grandparent of previously focused component should still have the lifecycle state "focus" (as part of the new focus chain)'
      )

      assert.end()
    })
  })
})

// @todo
// this test case needs some changes to the codebase in order to work
// these changes will help testablity in general

// test('Pass focus to parent when destroyed while having focus', (assert) => {
//   const parent = {
//     componentId: 'parent',
//     lifecycle: {
//       state: 'init',
//     },
//   }
//   const component = {
//     componentId: 'comp1',
//     parent,
//     lifecycle: {
//       state: 'init',
//     },
//   }

//   Focus.set(component)

//   setTimeout(() => {
//     assert.equal(Focus.get(), component, 'Component should have focus')

//     component.destroy()

//     setTimeout(() => {
//       assert.equal(Focus.get(), parent, 'Parent should have focus')
//     })

//     assert.end()
//   })
// })
