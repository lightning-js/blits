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

import test from 'tape'
import computedFn from './computed.js'
import symbols from '../../lib/symbols.js'
import { reactive } from '../../lib/reactivity/reactive.js'
import { effect, removeEffects } from '../../lib/reactivity/effect.js'
import { initLog } from '../../lib/log.js'

initLog()

// --- Helpers ---
const setup = (computeds = {}, values = {}) => {
  const component = Object.assign({}, values)
  computedFn(component, computeds)
  return Object.assign(Object.create(component), { [symbols.effects]: [] })
}

const assertComputed = (t, component, keyValues) => {
  for (const [key, expected] of Object.entries(keyValues)) {
    t.equal(component[key], expected, `${key} should compute correctly`)
  }
}

test('Computed caches repeated reads within one effect', (t) => {
  let calls = 0
  const component = setup({
    value() {
      calls++
      return 42
    },
  })
  const render = () => component.value + component.value

  effect(render)

  t.equal(calls, 1, 'Two reads share one computed calculation')
  removeEffects([render])
  t.end()
})

test('Computed shares its cache across effects and invalidates when a dependency changes', (t) => {
  const state = reactive({ count: 2 })
  let calls = 0
  const component = setup({
    isEven() {
      calls++
      return state.count % 2 === 0
    },
  })
  const first = () => component.isEven
  const second = () => component.isEven

  effect(first)
  effect(second)
  t.equal(calls, 1, 'Two effects share one computed calculation')

  state.count = 4
  t.equal(calls, 2, 'A dependency change causes only one new computed calculation')

  removeEffects([first, second])
  t.end()
})

test('Computed caches a value based on multiple state variables', (t) => {
  const state = reactive({ price: 10, quantity: 2 })
  let calls = 0
  const component = setup({
    total() {
      calls++
      return state.price * state.quantity
    },
  })

  t.equal(calls, 0, 'The computed is lazy')
  t.equal(component.total, 20, 'Reads both state variables')
  t.equal(component.total, 20, 'Returns the cached value')
  t.equal(calls, 1, 'Repeated reads calculate once')

  state.price = 15
  t.equal(component.total, 30, 'Changing price invalidates the cache')
  state.quantity = 3
  t.equal(component.total, 45, 'Changing quantity invalidates the cache')
  t.equal(calls, 3, 'Each dependency change causes one calculation on read')

  state.price = 20
  state.quantity = 4
  t.equal(calls, 3, 'Writes without reads do not calculate')
  t.equal(component.total, 80, 'The next read uses both latest values')
  t.equal(calls, 4, 'Multiple writes before a read share one calculation')
  removeEffects(component[symbols.effects])
  t.end()
})

test('Computed caches are isolated between instances sharing a prototype', (t) => {
  const first = setup(
    {
      doubled() {
        return this.state.count * 2
      },
    },
    { state: reactive({ count: 1 }) }
  )
  const second = Object.assign(Object.create(Object.getPrototypeOf(first)), {
    state: reactive({ count: 10 }),
    [symbols.effects]: [],
  })

  t.equal(first.doubled, 2, 'The first instance uses its own state')
  t.equal(second.doubled, 20, 'The second instance has its own cache')
  first.state.count = 2
  t.equal(first.doubled, 4, 'The first cache invalidates independently')
  t.equal(second.doubled, 20, 'The second cache stays unchanged')

  removeEffects(first[symbols.effects])
  removeEffects(second[symbols.effects])
  t.end()
})

test('Computed refreshes conditional dependencies', (t) => {
  const state = reactive({ useFirst: true, first: 1, second: 2, third: 3 })
  let calls = 0
  const component = setup({
    selected() {
      calls++
      return state.useFirst ? state.first + state.third : state.second
    },
  })
  const values = []
  const render = () => values.push(component.selected)
  effect(render, 'selected')

  state.useFirst = false
  state.first = 10
  state.third = 30
  t.equal(calls, 2, 'The previous branch no longer invalidates the computed')
  state.second = 20
  t.deepEqual(
    values,
    [4, 2, 20],
    'The shorter dependency list stays reactive through a filtered effect'
  )

  removeEffects([render, ...component[symbols.effects]])
  t.end()
})

test('Computed chains invalidate before consumers read shared dependencies', (t) => {
  const state = reactive({ count: 1 })
  const component = setup({
    doubled() {
      return state.count * 2
    },
    tripled() {
      return state.count * 3
    },
    total() {
      return this.doubled + this.tripled
    },
  })
  const values = []
  const render = () => values.push([state.count, component.total])
  effect(render)

  state.count = 2
  t.deepEqual(
    values,
    [
      [1, 5],
      [2, 10],
    ],
    'The consumer runs once with all caches up to date'
  )

  removeEffects([render, ...component[symbols.effects]])
  t.end()
})

test('Computed retries failed getters and releases its cache on cleanup', (t) => {
  const state = reactive({ fail: true })
  let calls = 0
  const component = setup({
    value() {
      calls++
      if (state.fail) throw new Error('Failed')
      return 42
    },
  })

  t.throws(() => component.value, /Failed/, 'Getter errors propagate')
  state.fail = false
  t.equal(component.value, 42, 'A failed getter can be retried')
  t.equal(component.value, 42, 'A successful retry is cached')
  t.equal(calls, 2, 'Failure does not cache a result')

  removeEffects(component[symbols.effects])
  state.fail = true
  t.equal(component.value, undefined, 'Cleanup releases the cached value')
  t.equal(calls, 2, 'A disposed computed no longer evaluates')
  t.end()
})

test('Computed invalidates when a parent object is replaced', (t) => {
  for (const mode of ['Proxy', 'defineProperty']) {
    const state = reactive({ user: { name: 'Ada' } }, mode)
    const component = setup({
      name() {
        return state.user?.name ?? 'Nobody'
      },
    })
    const names = []
    const render = () => names.push(component.name)
    effect(render)

    state.user = null
    t.equal(
      component.name,
      'Nobody',
      `${mode}: replacing an object with null invalidates the cache`
    )
    state.user = { name: 'Grace' }
    t.equal(component.name, 'Grace', `${mode}: replacing null with an object stays reactive`)
    state.user.name = 'Katherine'
    t.equal(component.name, 'Katherine', `${mode}: fields of the replacement stay reactive`)
    t.deepEqual(
      names,
      ['Ada', 'Nobody', 'Grace', 'Katherine'],
      `${mode}: consumers see every update`
    )

    removeEffects([render, ...component[symbols.effects]])
  }
  t.end()
})

test('Nested ordinary updates run synchronously inside computed consumers', (t) => {
  const state = reactive({ first: 0, second: 0 })
  const component = setup({
    first() {
      return state.first
    },
  })
  let observed = 0
  const observer = () => {
    observed = state.second
  }
  const writer = () => {
    const value = component.first
    if (value !== 0) {
      state.second = value
      t.equal(observed, value, 'The nested observer runs before the assignment returns')
    }
  }
  effect(observer)
  effect(writer)

  state.first = 1
  t.equal(observed, 1, 'The nested observer received the update')

  removeEffects([observer, writer, ...component[symbols.effects]])
  t.end()
})

test('Nested computed updates run synchronously without flushing unrelated consumers', (t) => {
  const state = reactive({ first: 0, second: 0 })
  const component = setup({
    first() {
      return state.first
    },
    second() {
      return state.second * 2
    },
  })
  const order = []
  const observer = () => {
    order.push(`second: ${component.second}`)
  }
  const writer = () => {
    const value = component.first
    if (value !== 0) {
      order.push('writer starts')
      state.second = value
      order.push('writer ends')
    }
  }
  const sibling = () => {
    order.push(`first: ${component.first}`)
  }
  effect(observer)
  effect(writer)
  effect(sibling)
  order.length = 0

  state.first = 1
  t.deepEqual(order, ['writer starts', 'second: 2', 'writer ends', 'first: 1'])

  removeEffects([observer, writer, sibling, ...component[symbols.effects]])
  t.end()
})

test('Nested computed updates can unsubscribe pending outer consumers', (t) => {
  const state = reactive({ first: 0, second: 0 })
  const component = setup({
    first() {
      return state.first
    },
    second() {
      return state.second
    },
  })
  let siblingRuns = 0
  const sibling = () => {
    component.first
    siblingRuns++
  }
  const observer = () => {
    if (component.second !== 0) removeEffects([sibling])
  }
  const writer = () => {
    if (component.first !== 0) state.second = component.first
  }
  effect(observer)
  effect(writer)
  effect(sibling)

  state.first = 1
  t.equal(siblingRuns, 1, 'An unsubscribed consumer is removed from the suspended outer queue')
  state.first = 2
  t.equal(siblingRuns, 1, 'The consumer stays unsubscribed')

  removeEffects([observer, writer, ...component[symbols.effects]])
  t.end()
})

test('Caught errors in nested computed updates preserve the outer queue', (t) => {
  const state = reactive({ first: 0, second: 0 })
  const component = setup({
    first() {
      return state.first
    },
    second() {
      return state.second
    },
  })
  const values = []
  const observer = () => {
    if (component.second !== 0) throw new Error('Nested failure')
  }
  const writer = () => {
    const value = component.first
    if (value !== 0) {
      t.throws(
        () => {
          state.second = value
        },
        /Nested failure/,
        'Nested errors remain synchronous'
      )
    }
  }
  const sibling = () => values.push(component.first)
  effect(observer)
  effect(writer)
  effect(sibling)

  state.first = 1
  state.first = 2
  t.deepEqual(values, [0, 1, 2], 'The outer queue resumes and later updates still work')

  removeEffects([observer, writer, sibling, ...component[symbols.effects]])
  t.end()
})

test('Basic computed functionality', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.firstName} ${this.lastName}`
      },
      isAdult() {
        return this.age >= 18
      },
    },
    { firstName: 'John', lastName: 'Doe', age: 25 }
  )

  t.deepEqual(
    component[symbols.computedKeys],
    ['fullName', 'isAdult'],
    'Should store computed keys'
  )
  assertComputed(t, component, { fullName: 'John Doe', isAdult: true })
  t.end()
})

test('Conflict detection', (t) => {
  const component = setup(
    {
      name() {
        return 'conflict'
      },
      title() {
        return 'conflict'
      },
      submit() {
        return 'conflict'
      },
      validComputed() {
        return 'works'
      },
    },
    {
      [symbols.stateKeys]: ['name'],
      [symbols.propKeys]: ['title'],
      [symbols.methodKeys]: ['submit'],
    }
  )

  t.deepEqual(
    component[symbols.computedKeys],
    ['validComputed'],
    'Only non-conflicting computed added'
  )
  t.equal(component.validComputed, 'works', 'Valid computed works')
  t.end()
})

test('Non-function computeds', (t) => {
  const component = setup({
    validFunction() {
      return 'valid'
    },
    invalidString: 'not a function',
    invalidNumber: 42,
  })

  t.deepEqual(
    component[symbols.computedKeys].sort(),
    ['validFunction', 'invalidNumber', 'invalidString'].sort(),
    'All keys should be included'
  )
  t.equal(component.validFunction, 'valid', 'Valid function computes correctly')
  t.end()
})

test('Edge cases & empty', (t) => {
  const emptyComp = setup({})
  const singleComp = setup({
    testComputed() {
      return 'test'
    },
  })

  t.deepEqual(emptyComp[symbols.computedKeys], [], 'Empty computeds produce empty keys')
  t.deepEqual(singleComp[symbols.computedKeys], ['testComputed'], 'Single computed added')
  t.equal(singleComp.testComputed, 'test', 'Computed works correctly')
  t.end()
})

test('Dynamic updates', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.state.firstName} ${this.state.lastName}`
      },
      description() {
        return `Name: ${this.fullName}`
      },
    },
    { state: reactive({ firstName: 'Jane', lastName: 'Smith' }) }
  )

  assertComputed(t, component, { fullName: 'Jane Smith', description: 'Name: Jane Smith' })
  component.state.firstName = 'John'
  assertComputed(t, component, { fullName: 'John Smith', description: 'Name: John Smith' })
  t.end()
})
