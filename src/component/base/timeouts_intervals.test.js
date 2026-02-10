/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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
import timeoutsIntervals from './timeouts_intervals.js'
import symbols from '../../lib/symbols.js'

test('Type', (assert) => {
  assert.equal(typeof timeoutsIntervals, 'object', 'timeoutsIntervals should be an object')
  assert.end()
})

test('$setTimeout method', (assert) => {
  const component = {
    eol: false,
    [symbols.timeouts]: [],
  }

  const timeoutId = timeoutsIntervals.$setTimeout.value.call(component, () => {}, 100)
  assert.ok(timeoutId !== undefined, 'Should return timeout ID')
  assert.equal(component[symbols.timeouts].length, 1, 'Should add timeout to array')

  // Clear with native clearTimeout to prevent execution
  clearTimeout(timeoutId)

  assert.end()
})

test('$setTimeout method when eol is true', (assert) => {
  const component = {
    eol: true,
    [symbols.timeouts]: [],
  }

  const result = timeoutsIntervals.$setTimeout.value.call(component, () => {}, 100)
  assert.equal(result, undefined, 'Should return undefined when eol is true')
  assert.equal(component[symbols.timeouts].length, 0, 'Should not add timeout when eol is true')

  assert.end()
})

test('$clearTimeout method', (assert) => {
  const component = { eol: false, [symbols.timeouts]: [] }
  let called = false

  const timeoutId = timeoutsIntervals.$setTimeout.value.call(
    component,
    () => {
      called = true
    },
    50
  )
  timeoutsIntervals.$clearTimeout.value.call(component, timeoutId)

  assert.equal(component[symbols.timeouts].length, 0, 'Removes timeout from array')

  setTimeout(() => {
    assert.false(called, 'Timeout does not execute after clear')
    assert.end()
  }, 100)
})

test('$clearTimeouts method', (assert) => {
  const component = { eol: false, [symbols.timeouts]: [] }
  let called1 = false
  let called2 = false

  timeoutsIntervals.$setTimeout.value.call(
    component,
    () => {
      called1 = true
    },
    50
  )
  timeoutsIntervals.$setTimeout.value.call(
    component,
    () => {
      called2 = true
    },
    50
  )
  timeoutsIntervals.$clearTimeouts.value.call(component)

  assert.equal(component[symbols.timeouts].length, 0, 'Clears all timeouts from array')

  setTimeout(() => {
    assert.false(called1, 'First timeout does not execute')
    assert.false(called2, 'Second timeout does not execute')
    assert.end()
  }, 100)
})

test('$setInterval method', (assert) => {
  const component = {
    eol: false,
    [symbols.intervals]: [],
  }

  const intervalId = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)
  assert.ok(intervalId !== undefined, 'Should return interval ID')
  assert.equal(component[symbols.intervals].length, 1, 'Should add interval to array')

  // Clear with native clearInterval to prevent execution
  clearInterval(intervalId)

  assert.end()
})

test('$setInterval method when eol is true', (assert) => {
  const component = {
    eol: true,
    [symbols.intervals]: [],
  }

  const result = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)
  assert.equal(result, undefined, 'Should return undefined when eol is true')
  assert.equal(component[symbols.intervals].length, 0, 'Should not add interval when eol is true')

  assert.end()
})

test('$clearInterval method', (assert) => {
  const component = { eol: false, [symbols.intervals]: [] }
  let called = false

  const intervalId = timeoutsIntervals.$setInterval.value.call(
    component,
    () => {
      called = true
    },
    50
  )
  timeoutsIntervals.$clearInterval.value.call(component, intervalId)

  assert.equal(component[symbols.intervals].length, 0, 'Removes interval from array')

  setTimeout(() => {
    assert.false(called, 'Interval does not execute after clear')
    assert.end()
  }, 150)
})

test('$clearIntervals method', (assert) => {
  const component = { eol: false, [symbols.intervals]: [] }
  let called1 = false
  let called2 = false

  timeoutsIntervals.$setInterval.value.call(
    component,
    () => {
      called1 = true
    },
    50
  )
  timeoutsIntervals.$setInterval.value.call(
    component,
    () => {
      called2 = true
    },
    50
  )
  timeoutsIntervals.$clearIntervals.value.call(component)

  assert.equal(component[symbols.intervals].length, 0, 'Clears all intervals from array')

  setTimeout(() => {
    assert.false(called1, 'First interval does not execute')
    assert.false(called2, 'Second interval does not execute')
    assert.end()
  }, 150)
})

test('Multiple timeouts management', (assert) => {
  const component = {
    eol: false,
    [symbols.timeouts]: [],
  }

  const timeoutId1 = timeoutsIntervals.$setTimeout.value.call(component, () => {}, 100)
  const timeoutId2 = timeoutsIntervals.$setTimeout.value.call(component, () => {}, 100)
  const timeoutId3 = timeoutsIntervals.$setTimeout.value.call(component, () => {}, 100)

  assert.equal(component[symbols.timeouts].length, 3, 'Should store multiple timeouts')
  assert.equal(component[symbols.timeouts][0], timeoutId1, 'Should store first timeout')
  assert.equal(component[symbols.timeouts][1], timeoutId2, 'Should store second timeout')
  assert.equal(component[symbols.timeouts][2], timeoutId3, 'Should store third timeout')

  // Clear one timeout
  timeoutsIntervals.$clearTimeout.value.call(component, timeoutId2)
  assert.equal(component[symbols.timeouts].length, 2, 'Should remove only the specified timeout')
  assert.equal(component[symbols.timeouts][0], timeoutId1, 'Should keep first timeout')
  assert.equal(component[symbols.timeouts][1], timeoutId3, 'Should keep third timeout')

  // Clear remaining timeouts to prevent execution
  clearTimeout(timeoutId1)
  clearTimeout(timeoutId3)

  assert.end()
})

test('Multiple intervals management', (assert) => {
  const component = {
    eol: false,
    [symbols.intervals]: [],
  }

  const intervalId1 = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)
  const intervalId2 = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)
  const intervalId3 = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)

  assert.equal(component[symbols.intervals].length, 3, 'Should store multiple intervals')
  assert.equal(component[symbols.intervals][0], intervalId1, 'Should store first interval')
  assert.equal(component[symbols.intervals][1], intervalId2, 'Should store second interval')
  assert.equal(component[symbols.intervals][2], intervalId3, 'Should store third interval')

  // Clear one interval
  timeoutsIntervals.$clearInterval.value.call(component, intervalId2)
  assert.equal(component[symbols.intervals].length, 2, 'Should remove only the specified interval')
  assert.equal(component[symbols.intervals][0], intervalId1, 'Should keep first interval')
  assert.equal(component[symbols.intervals][1], intervalId3, 'Should keep third interval')

  // Clear remaining intervals to prevent execution
  clearInterval(intervalId1)
  clearInterval(intervalId3)

  assert.end()
})

function createComponent(eol = false) {
  const component = {
    eol,
    [symbols.timeouts]: [],
    [symbols.debounces]: new Map(),
  }
  Object.defineProperties(component, timeoutsIntervals)
  return component
}

test('$debounce method', (assert) => {
  const component = createComponent()
  let called = false
  const timeoutId = timeoutsIntervals.$debounce.value.call(
    component,
    'test-key',
    () => {
      called = true
    },
    50
  )

  assert.ok(timeoutId !== undefined, 'Should return timeout ID')
  assert.equal(component[symbols.timeouts].length, 1, 'Should add timeout to array')
  assert.equal(component[symbols.debounces].size, 1, 'Should cache debounce by key')

  setTimeout(() => {
    assert.ok(called, 'Debounced function should execute after delay')
    assert.equal(component[symbols.debounces].size, 0, 'Should remove from cache after execution')
    assert.end()
  }, 100)
})

test('$debounce method when eol is true', (assert) => {
  const component = createComponent(true)
  const result = timeoutsIntervals.$debounce.value.call(component, 'test-key', () => {}, 50)

  assert.equal(result, undefined, 'Should return undefined when eol is true')
  assert.equal(component[symbols.timeouts].length, 0, 'Should not add timeout when eol is true')
  assert.equal(component[symbols.debounces].size, 0, 'Should not cache debounce when eol is true')
  assert.end()
})

test('$debounce method replaces existing debounce for same key', (assert) => {
  const component = createComponent()
  let called1 = false
  let called2 = false

  const timeoutId1 = timeoutsIntervals.$debounce.value.call(
    component,
    'same-key',
    () => {
      called1 = true
    },
    50
  )

  const timeoutId2 = timeoutsIntervals.$debounce.value.call(
    component,
    'same-key',
    () => {
      called2 = true
    },
    50
  )

  assert.notEqual(timeoutId1, timeoutId2, 'Should create new timeout ID')
  assert.equal(component[symbols.timeouts].length, 1, 'Should have only one timeout')
  assert.equal(component[symbols.debounces].size, 1, 'Should have only one cached debounce')

  setTimeout(() => {
    assert.false(called1, 'First debounced function should not execute')
    assert.ok(called2, 'Second debounced function should execute')
    assert.end()
  }, 100)
})

test('$debounce method with multiple keys', (assert) => {
  const component = createComponent()
  let called1 = false
  let called2 = false

  timeoutsIntervals.$debounce.value.call(
    component,
    'key1',
    () => {
      called1 = true
    },
    50
  )

  timeoutsIntervals.$debounce.value.call(
    component,
    'key2',
    () => {
      called2 = true
    },
    50
  )

  assert.equal(component[symbols.timeouts].length, 2, 'Should track both timeouts')
  assert.equal(component[symbols.debounces].size, 2, 'Should cache both debounces')

  setTimeout(() => {
    assert.ok(called1, 'First debounced function should execute')
    assert.ok(called2, 'Second debounced function should execute')
    assert.end()
  }, 100)
})

test('$clearDebounce method', (assert) => {
  const component = createComponent()
  let called = false

  timeoutsIntervals.$debounce.value.call(
    component,
    'test-key',
    () => {
      called = true
    },
    50
  )

  timeoutsIntervals.$clearDebounce.value.call(component, 'test-key')

  assert.equal(component[symbols.timeouts].length, 0, 'Removes timeout from array')
  assert.equal(component[symbols.debounces].size, 0, 'Removes from cache')

  setTimeout(() => {
    assert.false(called, 'Debounced function should not execute after clear')
    assert.end()
  }, 100)
})

test('$clearDebounce method with non-existent key', (assert) => {
  const component = createComponent()
  timeoutsIntervals.$clearDebounce.value.call(component, 'non-existent')

  assert.equal(component[symbols.timeouts].length, 0, 'Should not affect timeouts')
  assert.equal(component[symbols.debounces].size, 0, 'Should not affect debounces')
  assert.end()
})

test('$clearDebounces method', (assert) => {
  const component = createComponent()
  let called1 = false
  let called2 = false

  timeoutsIntervals.$debounce.value.call(
    component,
    'key1',
    () => {
      called1 = true
    },
    50
  )

  timeoutsIntervals.$debounce.value.call(
    component,
    'key2',
    () => {
      called2 = true
    },
    50
  )

  timeoutsIntervals.$clearDebounces.value.call(component)

  assert.equal(component[symbols.timeouts].length, 0, 'Clears all timeouts from array')
  assert.equal(component[symbols.debounces].size, 0, 'Clears all from cache')

  setTimeout(() => {
    assert.false(called1, 'First debounced function should not execute')
    assert.false(called2, 'Second debounced function should not execute')
    assert.end()
  }, 100)
})

test('$debounce method with parameters', (assert) => {
  const component = createComponent()
  let receivedParams = null

  timeoutsIntervals.$debounce.value.call(
    component,
    'test-key',
    (param1, param2) => {
      receivedParams = [param1, param2]
    },
    50,
    'value1',
    'value2'
  )

  setTimeout(() => {
    assert.deepEqual(receivedParams, ['value1', 'value2'], 'Should pass parameters correctly')
    assert.end()
  }, 100)
})

test('$debounce method with context', (assert) => {
  const component = createComponent()
  let receivedContext = null

  timeoutsIntervals.$debounce.value.call(
    component,
    'test-key',
    function () {
      receivedContext = this
    },
    50
  )

  setTimeout(() => {
    assert.equal(receivedContext, component, 'Should call with component as context')
    assert.end()
  }, 100)
})

test('$debounce method with zero delay', (assert) => {
  const component = createComponent()
  let called = false

  timeoutsIntervals.$debounce.value.call(
    component,
    'test-key',
    () => {
      called = true
    },
    0
  )

  setTimeout(() => {
    assert.ok(called, 'Should execute with zero delay')
    assert.end()
  }, 10)
})
