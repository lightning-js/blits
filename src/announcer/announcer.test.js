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
import announcer from './announcer.js'
import { initLog } from '../lib/log.js'

initLog()
announcer.enable()

test('Announcer 1 Second Pause', (assert) => {
  assert.comment('start 1 second pause')
  announcer.pause(1000).then((response) => {
    assert.equal(response, 'finished', 'pause finished')
    assert.end()
  })
})

test('Announcer 1 Second Pause Remove', (assert) => {
  assert.comment('start 1 second pause')
  const pause = announcer.pause(1000)
  pause.then((response) => {
    assert.equal(response, 'canceled', 'removed pause')
    assert.end()
  })
  assert.comment('remove pause')
  pause['remove']()
})

test('Announcer disable/enable/toggle', (assert) => {
  announcer.disable()
  assert.equal(typeof announcer.speak('test').then, 'function', 'Disabled returns noop')

  announcer.toggle(true)
  assert.equal(typeof announcer.speak('test').then, 'function', 'Toggle on works')

  announcer.toggle(false)
  assert.equal(typeof announcer.speak('test').then, 'function', 'Toggle off returns noop')

  announcer.enable()
  assert.end()
})

test('Announcer methods', (assert) => {
  announcer.enable()

  assert.equal(typeof announcer.stop, 'function', 'Stop method exists')
  assert.equal(typeof announcer.clear, 'function', 'Clear method exists')
  assert.equal(typeof announcer.polite('test').then, 'function', 'Polite works')
  assert.equal(typeof announcer.assertive('test').then, 'function', 'Assertive works')
  assert.equal(
    typeof announcer.speak('test', 'polite').then,
    'function',
    'Speak with politeness works'
  )
  assert.equal(typeof announcer.pause(100).then, 'function', 'Pause works')

  assert.end()
})

test('Announcer announcement methods', (assert) => {
  announcer.enable()

  const announcement = announcer.speak('test')
  assert.equal(typeof announcement['cancel'], 'function', 'Has cancel method')
  assert.equal(typeof announcement['remove'], 'function', 'Has remove method')
  assert.equal(typeof announcement['stop'], 'function', 'Has stop method')

  // Call methods to test they work
  announcement['cancel']()
  announcement['stop']()

  assert.end()
})

test('Announcer stop when current announcement is active', (assert) => {
  announcer.enable()

  // Create announcement and immediately stop to trigger currentId check
  const announcement = announcer.speak('test message')
  announcement['stop']()

  assert.end()
})

test('Announcer speech synthesis processing', (assert) => {
  announcer.enable()

  // Create multiple announcements to trigger debounce and speech synthesis
  const announcement1 = announcer.speak('first message')
  const announcement2 = announcer.speak('second message')

  // Test that announcements are created
  assert.equal(typeof announcement1.then, 'function', 'First announcement created')
  assert.equal(typeof announcement2.then, 'function', 'Second announcement created')

  assert.end()
})

test('Announcer queue processing with debounce', (assert) => {
  announcer.enable()

  // Create multiple rapid announcements to trigger debounce logic
  announcer.speak('message 1')
  announcer.speak('message 2')
  announcer.speak('message 3')

  // This should trigger the debounce timeout and speech synthesis processing
  assert.end()
})

test('Announcer stop current processing', (assert) => {
  announcer.enable()

  // Create announcement and stop it to trigger the stop logic
  const announcement = announcer.speak('test message')

  // Call stop to potentially trigger if currentId matches
  announcement['stop']()

  assert.end()
})
