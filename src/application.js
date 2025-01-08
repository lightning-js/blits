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

  config.hooks[symbols.destroy] = function () {
    document.removeEventListener('keydown', keyDownHandler)
    document.removeEventListener('keyup', keyUpHandler)
  }

  config.hooks[symbols.init] = function () {
    const keyMap = { ...defaultKeyMap, ...Settings.get('keymap', {}) }

    keyDownHandler = async (e) => {
      const key = keyMap[e.key] || keyMap[e.keyCode] || e.key || e.keyCode
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
