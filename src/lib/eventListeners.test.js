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
import eventListener from './eventListeners.js'

const resetModule = () => {
  eventListener.removeListeners('testComponent')
  eventListener.removeListeners('anotherComponent')
}

test('registerListener', (t) => {
  resetModule()

  const component = 'testComponent'
  const event = 'testEvent'
  const cb = () => {}

  t.doesNotThrow(
    () => eventListener.registerListener(component, event, cb),
    'Should not throw exception when registering a listener'
  )

  t.doesNotThrow(
    () => eventListener.registerListener(component, event, cb, 1),
    'Should not throw exception when registering a listener with priority'
  )

  t.doesNotThrow(
    () => eventListener.registerListener('anotherComponent', event, cb),
    'Should not throw exception when registering multiple components for the same event'
  )

  t.end()
})

test('executeListeners - no listeners', (t) => {
  resetModule()

  const result = eventListener.executeListeners('nonExistentEvent')
  t.equal(result, true, 'Should return true when no listeners are registered')

  t.end()
})

test('executeListeners - with listeners', (t) => {
  resetModule()

  const component = 'testComponent'
  const event = 'testEvent'
  let callCount = 0
  const cb1 = () => {
    callCount++
  }
  const cb2 = () => {
    callCount++
  }

  eventListener.registerListener(component, event, cb1)
  eventListener.registerListener(component, event, cb2)

  const result = eventListener.executeListeners(event)
  t.equal(result, true, 'Should return true when all listeners execute successfully')
  t.equal(callCount, 2, 'Should call all registered callbacks')

  t.end()
})

test('executeListeners - priority order', (t) => {
  resetModule()

  const component = 'testComponent'
  const event = 'testEvent'
  const order = []
  const cb1 = () => {
    order.push(1)
  }
  const cb2 = () => {
    order.push(2)
  }
  const cb3 = () => {
    order.push(3)
  }

  eventListener.registerListener(component, event, cb1, 1)
  eventListener.registerListener(component, event, cb2, 3)
  eventListener.registerListener(component, event, cb3, 2)

  eventListener.executeListeners(event)
  t.deepEqual(order, [2, 3, 1], 'Should execute callbacks in priority order')

  t.end()
})

test('executeListeners - stop propagation', (t) => {
  resetModule()

  const component = 'testComponent'
  const event = 'testEvent'
  let callCount = 0
  const cb1 = () => {
    callCount++
    return false
  }
  const cb2 = () => {
    callCount++
  }

  eventListener.registerListener(component, event, cb1)
  eventListener.registerListener(component, event, cb2)

  const result = eventListener.executeListeners(event)
  t.equal(result, false, 'Should return false when propagation is stopped')
  t.equal(callCount, 1, 'Should stop calling callbacks after one returns false')

  t.end()
})

test('removeListeners', (t) => {
  resetModule()

  const component = 'testComponent'
  const event1 = 'testEvent1'
  const event2 = 'testEvent2'
  const cb = () => {}

  eventListener.registerListener(component, event1, cb)
  eventListener.registerListener(component, event2, cb)
  eventListener.registerListener('anotherComponent', event1, cb)

  eventListener.removeListeners(component)

  const result1 = eventListener.executeListeners(event1)
  t.equal(result1, true, 'Should still return true for event1 as another component is registered')

  const result2 = eventListener.executeListeners(event2)
  t.equal(result2, true, 'Should return true for event2 as no listeners remain')

  t.end()
})

test('cache invalidation', (t) => {
  resetModule()

  const component = 'testComponent'
  const event = 'testEvent'
  let callOrder = []
  const cb1 = () => {
    callOrder.push(1)
  }
  const cb2 = () => {
    callOrder.push(2)
  }

  eventListener.registerListener(component, event, cb1)
  eventListener.executeListeners(event)

  eventListener.registerListener(component, event, cb2, 1)
  eventListener.executeListeners(event)

  t.deepEqual(callOrder, [1, 2, 1], 'Should invalidate cache when new listener is added')

  callOrder = []
  eventListener.removeListeners(component)
  eventListener.registerListener(component, event, cb1)
  eventListener.executeListeners(event)

  t.deepEqual(callOrder, [1], 'Should invalidate cache when listeners are removed')

  t.end()
})
