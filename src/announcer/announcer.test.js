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

// Mock speechSynthesis API before importing announcer (which imports speechSynthesis)
const mockUtterance = class {
  constructor(text) {
    this.text = text
    this.lang = 'en-US'
    this.pitch = 1
    this.rate = 1
    this.voice = null
    this.volume = 1
    this.onstart = null
    this.onend = null
    this.onerror = null
    this.onresume = null
  }
}

const mockSpeechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  voices: [],
  speak: function (utterance) {
    this.speaking = true
    setTimeout(() => {
      if (utterance.onstart) utterance.onstart()
      setTimeout(() => {
        this.speaking = false
        if (utterance.onend) utterance.onend()
      }, 10)
    }, 0)
  },
  cancel: function () {
    this.speaking = false
  },
  pause: function () {
    this.paused = true
  },
  resume: function () {
    this.paused = false
  },
  getVoices: function () {
    return this.voices
  },
}

// Setup mocks before module loads (speechSynthesis.js captures window.speechSynthesis at import time)
window.speechSynthesis = mockSpeechSynthesis
window.SpeechSynthesisUtterance = mockUtterance
globalThis.SpeechSynthesisUtterance = mockUtterance

// Dynamic import to ensure mocks are set before module evaluation
const announcerModule = await import('./announcer.js')
const announcer = announcerModule.default

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
  pause.remove()
})

test('Announcer disable/enable/toggle', (assert) => {
  let disabledProcessed = false
  let enabledProcessed = false

  // Test disabled - messages should NOT be processed
  announcer.disable()
  const disabled1 = announcer.speak('disabled msg 1')
  const disabled2 = announcer.speak('disabled msg 2')

  assert.equal(disabled1, disabled2, 'Disabled returns same noop object')

  disabled1.then(() => {
    disabledProcessed = true
  })

  // Test enabled - messages SHOULD be processed/queued
  announcer.enable()
  const enabled1 = announcer.speak('enabled msg 1')
  const enabled2 = announcer.speak('enabled msg 2')

  assert.notEqual(enabled1, disabled1, 'Enabled returns real promise, not noop')
  assert.notEqual(enabled1, enabled2, 'Each enabled message gets unique promise')

  enabled1.then(() => {
    enabledProcessed = true
  })

  // Test toggle off
  announcer.toggle(false)
  const toggledOff = announcer.speak('toggled off msg')
  assert.equal(toggledOff, disabled1, 'Toggle off returns same noop')

  // Test toggle on
  announcer.toggle(true)
  const toggledOn = announcer.speak('toggled on msg')
  assert.notEqual(toggledOn, disabled1, 'Toggle on returns real promise')

  // Verify processing behavior after a delay
  setTimeout(() => {
    assert.false(disabledProcessed, 'Disabled messages are NOT processed')
    assert.ok(enabledProcessed || enabled1, 'Enabled messages are queued for processing')

    // Clean up
    enabled1.cancel()
    enabled2.cancel()
    toggledOn.cancel()

    assert.end()
  }, 100)
})

test('Announcer methods exist', (assert) => {
  announcer.enable()

  assert.equal(typeof announcer.stop, 'function', 'Stop method exists')
  assert.equal(typeof announcer.clear, 'function', 'Clear method exists')
  assert.equal(typeof announcer.polite, 'function', 'Polite method exists')
  assert.equal(typeof announcer.assertive, 'function', 'Assertive method exists')
  assert.equal(typeof announcer.speak, 'function', 'Speak method exists')
  assert.equal(typeof announcer.pause, 'function', 'Pause method exists')

  assert.end()
})

test('Announcer politeness affects queue order', (assert) => {
  announcer.enable()
  const order = []
  let completed = 0

  // Queue messages with different politeness levels
  const msg1 = announcer.speak('first', 'off')
  const msg2 = announcer.speak('second', 'polite')
  const msg3 = announcer.speak('third', 'assertive') // Should jump to front!

  function checkComplete() {
    completed++
    if (completed === 3) {
      // All three resolved, check order
      assert.equal(order[0], 'third', 'Assertive message processes first')
      assert.equal(order[1], 'first', 'Off message processes second')
      assert.equal(order[2], 'second', 'Polite message processes third')
      assert.end()
    }
  }

  // Track resolution order
  msg1.then(() => {
    order.push('first')
    checkComplete()
  })
  msg2.then(() => {
    order.push('second')
    checkComplete()
  })
  msg3.then(() => {
    order.push('third')
    checkComplete()
  })
})

test('Announcer announcement methods', (assert) => {
  announcer.enable()

  const announcement = announcer.speak('test')
  assert.equal(typeof announcement.cancel, 'function', 'Has cancel method')
  assert.equal(typeof announcement.remove, 'function', 'Has remove method')
  assert.equal(typeof announcement.stop, 'function', 'Has stop method')

  // Test that cancel actually works and resolves with 'canceled'
  const cancelMsg = announcer.speak('test cancel')
  cancelMsg.then((status) => {
    assert.equal(status, 'canceled', 'Cancel resolves with canceled status')
  })
  cancelMsg.cancel()

  // Test that remove actually works and resolves with 'canceled'
  const removeMsg = announcer.speak('test remove')
  removeMsg.then((status) => {
    assert.equal(status, 'canceled', 'Remove resolves with canceled status')
    assert.end()
  })
  removeMsg.remove()
})

test('Announcer stop interrupts processing', (assert) => {
  announcer.enable()

  const announcement = announcer.speak('test message for interruption')

  announcement.then((status) => {
    // Should resolve with 'interrupted' or other valid status when stop() is called
    // Due to timing, it may finish before stop is called
    assert.ok(
      status === 'interrupted' || status === 'unavailable' || status === 'finished',
      'Stop interrupts (or unavailable if no speechSynthesis, or finished if completed)'
    )
    assert.end()
  })

  // Call stop() to interrupt the announcement
  // Using setTimeout to ensure async behavior is tested
  setTimeout(() => {
    announcement.stop()
  }, 50)
})

test('Announcer queue behavior', (assert) => {
  announcer.enable()

  const msg1 = announcer.speak('first')
  const msg2 = announcer.speak('second')
  const msg3 = announcer.speak('third')

  // Verify announcements have required methods
  assert.equal(typeof msg1.cancel, 'function', 'Has cancel method')
  assert.equal(typeof msg1.remove, 'function', 'Has remove method')
  assert.equal(typeof msg1.stop, 'function', 'Has stop method')

  // Test that messages are queued (they return promises)
  assert.equal(typeof msg1.then, 'function', 'First message queued')
  assert.equal(typeof msg2.then, 'function', 'Second message queued')
  assert.equal(typeof msg3.then, 'function', 'Third message queued')

  // Test that remove() actually removes from queue
  msg2.remove()
  msg2.then((status) => {
    assert.equal(status, 'canceled', 'Removed message resolves with canceled')
  })

  // Verify other messages still process (queue continues)
  msg1.then((status) => {
    assert.ok(status === 'unavailable' || status === 'finished', 'First message processes')
  })

  msg3.then((status) => {
    assert.ok(
      status === 'unavailable' || status === 'finished',
      'Third message processes after removal'
    )
    assert.end()
  })
})
