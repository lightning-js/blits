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

class TestKeyboardEvent {
  constructor(type, init = {}) {
    this.type = type
    this.key = init.key
    this.code = init.code
    this.keyCode = init.keyCode || 0
    this.bubbles = init.bubbles === true
    this.cancelable = init.cancelable === true
    this.composed = init.composed === true
    this.timeStamp = init.timeStamp || Date.now()
  }
}

const createEventTarget = () => {
  const listeners = {}

  return {
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || []
      listeners[type].push(handler)
    },
    removeEventListener(type, handler) {
      const handlers = listeners[type]
      if (handlers === undefined) return
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    },
    dispatchEvent(event) {
      const handlers = listeners[event.type] || []
      for (let i = 0; i < handlers.length; i++) {
        handlers[i](event)
      }
      return true
    },
  }
}

const createStorage = () => {
  const store = {}

  return {
    getItem(key) {
      return store[key] !== undefined ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      const keys = Object.keys(store)
      for (let i = 0; i < keys.length; i++) {
        delete store[keys[i]]
      }
    },
  }
}

const nodePlatform = () => {
  const input = createEventTarget()
  const viewport = createEventTarget()
  let cookie = ''

  return {
    input,
    viewport,
    dispatchEvent: input.dispatchEvent.bind(input),
    localStorage: createStorage(),
    getCookie: () => cookie,
    setCookie: (value) => {
      cookie = value
    },
    historyBack() {},
    screenHeight: 1080,
    hardwareConcurrency: 1,
    userAgent: 'node',
    KeyboardEvent: TestKeyboardEvent,
    isKeyboardEvent: (event) => event instanceof TestKeyboardEvent,
    createKeyboardEvent: (type, init = {}) => new TestKeyboardEvent(type, init),
    SpeechSynthesisUtterance: class TestSpeechSynthesisUtterance {
      constructor(text = '') {
        this.text = text
      }
    },
    speechSynthesis: {
      cancel() {},
      getVoices() {
        return []
      },
      pause() {},
      resume() {},
      speak() {},
    },
    now: Date.now,
  }
}

export default nodePlatform
