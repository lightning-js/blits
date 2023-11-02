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
import Focus from './focus.js'
import Settings from './settings.js'

import symbols from './lib/symbols.js'

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

  let handler

  config.hooks[symbols.destroy] = function () {
    document.removeEventListener('keydown', handler)
  }

  config.hooks.___init = function () {
    const keyMap = { ...defaultKeyMap, ...Settings.get('keymap', {}) }

    handler = (e) => {
      const key = keyMap[e.key] || keyMap[e.keyCode] || e.key || e.keyCode
      Focus.input(key, e)
    }

    document.addEventListener('keydown', handler)
  }

  config.hooks.___ready = function () {
    Focus.set(this)
  }

  const App = Component('App', config)

  return App
}

export default Application
