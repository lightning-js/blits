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

import Component from './component.js'
import { default as Focus, keyUpCallbacks } from './focus.js'
import Settings from './settings.js'

import symbols from './lib/symbols.js'
import { DEFAULT_HOLD_TIMEOUT_MS } from './constants.js'

const Application = (config) => {
  const defaultKeyMap = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Enter: 'enter',
    ' ': 'space',
    Backspace: 'back',
    Escape: 'escape',
    37: 'left',
    39: 'right',
    38: 'up',
    40: 'down',
    13: 'enter',
    32: 'space',
    8: 'back',
    27: 'escape',
  }

  config.hooks = config.hooks || {}

  let keyDownHandler
  let keyUpHandler
  let holdTimeout
  let lastInputTime = 0
  let lastInputKey = null

  config.hooks[symbols.destroy] = function () {
    document.removeEventListener('keydown', keyDownHandler)
    document.removeEventListener('keyup', keyUpHandler)
  }

  config.hooks[symbols.init] = function () {
    // set the initial activation state of the announcer based on launch setting
    this.$announcer.toggle(Settings.get('announcer', false))
    const keyMap = { ...defaultKeyMap, ...Settings.get('keymap', {}) }

    /** @type {number} Input throttle time in milliseconds (0 = disabled) */
    const throttleMs = Settings.get('inputThrottle', 0)

    keyDownHandler = async (e) => {
      const currentTime = performance.now()

      const key = keyMap[e.key] || keyMap[e.keyCode] || e.key || e.keyCode
      const sameKey = lastInputKey === key
      lastInputKey = key
      // execute immediately when no throttle is specified or event is internal (bubbled up by focus manager)
      // or key is different from the last used key
      if (throttleMs === 0 || e[symbols.internalEvent] === true || sameKey === false) {
        return await processInput.call(this, e, key)
      }

      if (currentTime - lastInputTime < throttleMs) {
        return
      }

      lastInputTime = currentTime
      await processInput.call(this, e, key)
    }

    const processInput = async function (e, key) {
      // intercept key press if specified in main Application component
      if (
        this[symbols.inputEvents] !== undefined &&
        this[symbols.inputEvents].intercept !== undefined
      ) {
        e = await this[symbols.inputEvents].intercept.call(this, e)
        // only pass on the key press to focused component when keyboard event is returned
        if (e instanceof KeyboardEvent === false) return
      }

      Focus.input(key, e)
      clearTimeout(holdTimeout)
      holdTimeout = setTimeout(() => {
        Focus.hold = true
      }, Settings.get('holdTimeout', DEFAULT_HOLD_TIMEOUT_MS))
    }

    keyUpHandler = (e) => {
      const cb = keyUpCallbacks.get(e.code)
      if (cb !== undefined && typeof cb === 'function') {
        keyUpCallbacks.delete(e.code)
        cb()
      }
      clearTimeout(holdTimeout)
      Focus.hold = false
    }

    document.addEventListener('keydown', keyDownHandler)
    document.addEventListener('keyup', keyUpHandler)

    // next tick
    setTimeout(() => Focus.set(this))
  }

  return Component('App', config)
}

export default Application
