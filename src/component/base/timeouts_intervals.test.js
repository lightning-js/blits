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

  // Clear the timeout immediately to prevent it from executing
  timeoutsIntervals.$clearTimeout.value.call(component, timeoutId)
  assert.equal(component[symbols.timeouts].length, 0, 'Should clear timeout')

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
  const component = { [symbols.timeouts]: [123, 456] }

  timeoutsIntervals.$clearTimeout.value.call(component, 123)
  assert.equal(component[symbols.timeouts].length, 1, 'Should remove timeout from array')
  assert.equal(component[symbols.timeouts][0], 456, 'Should keep other timeouts')

  assert.end()
})

test('$clearTimeouts method', (assert) => {
  const component = { [symbols.timeouts]: [123, 456, 789] }
  timeoutsIntervals.$clearTimeouts.value.call(component)
  assert.equal(component[symbols.timeouts].length, 0, 'Should clear all timeouts')

  assert.end()
})

test('$setInterval method', (assert) => {
  const component = {
    eol: false,
    [symbols.intervals]: [],
  }

  const intervalId = timeoutsIntervals.$setInterval.value.call(component, () => {}, 100)
  assert.ok(intervalId !== undefined, 'Should return interval ID')
  assert.equal(component[symbols.intervals].length, 1, 'Should add interval to array')

  // Clear the interval immediately to prevent it from running
  timeoutsIntervals.$clearInterval.value.call(component, intervalId)
  assert.equal(component[symbols.intervals].length, 0, 'Should clear interval')

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
  const component = { [symbols.intervals]: [123, 456] }

  timeoutsIntervals.$clearInterval.value.call(component, 123)
  assert.equal(component[symbols.intervals].length, 1, 'Should remove interval from array')
  assert.equal(component[symbols.intervals][0], 456, 'Should keep other intervals')

  assert.end()
})

test('$clearIntervals method', (assert) => {
  const component = { [symbols.intervals]: [123, 456, 789] }

  timeoutsIntervals.$clearIntervals.value.call(component)
  assert.equal(component[symbols.intervals].length, 0, 'Should clear all intervals')

  assert.end()
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

  assert.end()
})
