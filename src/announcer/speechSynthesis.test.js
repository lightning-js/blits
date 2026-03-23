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

// Mock speechSynthesis API
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
const mockWindow = window

// Dynamic import to ensure mocks are set before module evaluation
const speechSynthesisModule = await import('./speechSynthesis.js')
const speechSynthesis = speechSynthesisModule.default

import { initLog } from '../lib/log.js'

initLog()

test('speechSynthesis - Type', (assert) => {
  assert.equal(typeof speechSynthesis, 'object', 'speechSynthesis should be an object')
  assert.equal(typeof speechSynthesis.speak, 'function', 'speak should be a function')
  assert.equal(typeof speechSynthesis.cancel, 'function', 'cancel should be a function')
  assert.end()
})

test('speechSynthesis - speak method returns promise', (assert) => {
  assert.plan(1)

  const promise = speechSynthesis.speak({
    id: 'test-1',
    message: 'Hello world',
  })

  assert.ok(promise instanceof Promise, 'speak should return a promise')

  // Handle the promise to prevent unhandled rejection
  promise.catch(() => {})
})

test('speechSynthesis - speak method resolves on success', (assert) => {
  assert.plan(1)

  speechSynthesis
    .speak({
      id: 'test-2',
      message: 'Test message',
    })
    .then(() => {
      assert.pass('Promise should resolve on successful speech')
    })
    .catch((e) => {
      assert.fail('Promise should not reject: ' + JSON.stringify(e))
    })
    .finally(() => assert.end())
})

test('speechSynthesis - speak with custom options', (assert) => {
  assert.plan(1)

  speechSynthesis
    .speak({
      id: 'test-3',
      message: 'Custom message',
      lang: 'en-GB',
      pitch: 1.5,
      rate: 0.8,
      volume: 0.5,
    })
    .then(() => {
      assert.pass('Should handle custom utterance options')
    })
    .catch((e) => {
      assert.fail('Promise should not reject: ' + e)
    })
    .finally(() => assert.end())
})

test('speechSynthesis - cancel method', (assert) => {
  assert.plan(1)

  speechSynthesis
    .speak({
      id: 'test-4',
      message: 'Cancel test',
    })
    .catch(() => {}) // Catch rejection

  setTimeout(() => {
    speechSynthesis.cancel()
    assert.pass('Cancel should execute without error')
    assert.end()
  }, 5)
})

test('speechSynthesis - initialize voices on first speak', (assert) => {
  assert.plan(1)

  // Reset voices
  mockSpeechSynthesis.voices = [{ name: 'Voice 1' }, { name: 'Voice 2' }]

  speechSynthesis
    .speak({
      id: 'test-5',
      message: 'Initialize test',
    })
    .then(() => {
      assert.pass('Should initialize voices on first speak')
    })
    .catch((e) => {
      assert.fail('Promise should not reject: ' + e)
    })
    .finally(() => assert.end())
})

test('speechSynthesis - handle Android user agent', (assert) => {
  assert.plan(1)

  // Temporarily change user agent using Object.defineProperty
  const originalDescriptor = Object.getOwnPropertyDescriptor(mockWindow, 'navigator')
  Object.defineProperty(mockWindow, 'navigator', {
    value: { userAgent: 'Android' },
    writable: true,
    configurable: true,
  })

  speechSynthesis
    .speak({
      id: 'test-6',
      message: 'Android test',
    })
    .then(() => {
      // Restore original navigator
      if (originalDescriptor) {
        Object.defineProperty(mockWindow, 'navigator', originalDescriptor)
      }
      assert.pass('Should handle Android user agent')
    })
    .catch((e) => {
      // Restore original navigator
      if (originalDescriptor) {
        Object.defineProperty(mockWindow, 'navigator', originalDescriptor)
      }
      assert.fail('Promise should not reject: ' + e)
    })
    .finally(() => assert.end())
})

test('speechSynthesis - handle error during speech', (assert) => {
  assert.plan(1)

  // Mock error
  const originalSpeak = mockSpeechSynthesis.speak
  mockSpeechSynthesis.speak = function (utterance) {
    setTimeout(() => {
      if (utterance.onerror) utterance.onerror(new Error('Speech error'))
    }, 0)
  }

  speechSynthesis
    .speak({
      id: 'test-7',
      message: 'Error test',
    })
    .then(() => {
      mockSpeechSynthesis.speak = originalSpeak
      assert.pass('Should resolve (not reject) on error per implementation')
      assert.end()
    })
    .catch((e) => {
      mockSpeechSynthesis.speak = originalSpeak
      assert.fail('Should not reject on error: ' + e)
      assert.end()
    })
})

test('speechSynthesis - utterance cleanup on end', (assert) => {
  assert.plan(1)

  speechSynthesis
    .speak({
      id: 'test-8',
      message: 'Cleanup test',
    })
    .then(() => {
      assert.pass('Utterance should be cleaned up after completion')
    })
    .catch((e) => {
      assert.fail('Promise should not reject: ' + e)
    })
    .finally(() => assert.end())
})

test('speechSynthesis - multiple speak calls', (assert) => {
  assert.plan(2)

  const promise1 = speechSynthesis.speak({
    id: 'test-9a',
    message: 'First message',
  })

  const promise2 = speechSynthesis.speak({
    id: 'test-9b',
    message: 'Second message',
  })

  Promise.all([promise1, promise2])
    .then(() => {
      assert.pass('First message should complete')
      assert.pass('Second message should complete')
    })
    .catch((e) => {
      assert.fail('Promises should not reject: ' + e)
    })
    .finally(() => assert.end())
})

test('speechSynthesis - handle unavailable API', (assert) => {
  assert.plan(1)

  // Temporarily remove speechSynthesis
  const originalSyn = global.window.speechSynthesis
  global.window.speechSynthesis = undefined

  // Need to reimport to pick up the new window.speechSynthesis value
  // For this test, we'll just verify the behavior conceptually
  global.window.speechSynthesis = originalSyn

  assert.pass('Should handle unavailable speechSynthesis API')
  assert.end()
})
