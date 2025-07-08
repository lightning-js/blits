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

import symbols from './lib/symbols.js'
import { state } from './router/router.js'
import Settings from './settings.js'
import { DEFAULT_HOLD_TIMEOUT_MS } from './constants.js'

let focusedComponent = null
let focusChain = []
let setFocusTimeout

export const keyUpCallbacks = new Map()

/**
 * Safely unfocus a component with error handling
 * @param {Object} component - The component to unfocus
 */
const safeUnfocus = (component) => {
  try {
    if (component && typeof component.unfocus === 'function') {
      component.unfocus()
    }
  } catch (error) {
    console.warn('Error during unfocus operation:', error)
  }
}

export default {
  _hold: false,
  set hold(v) {
    this._hold = v
  },
  get hold() {
    return this._hold
  },
  get() {
    return focusedComponent
  },
  set(component, event) {
    const currentFocused = focusedComponent
    const componentParent = component.parent
    const isHold = this.hold

    // early return if already focused
    if (component === currentFocused) return
    clearTimeout(setFocusTimeout)

    if (currentFocused && currentFocused !== componentParent) {
      safeUnfocus(currentFocused)
    }

    let i = focusChain.length
    while (i--) {
      safeUnfocus(focusChain[i])
    }

    // cache timeout value to avoid repeated computation
    const timeoutMs = isHold ? Settings.get('holdTimeout', DEFAULT_HOLD_TIMEOUT_MS) : 0

    setFocusTimeout = setTimeout(() => {
      focusedComponent = component
      component.lifecycle.state = 'focus'

      if (event instanceof KeyboardEvent) {
        const internalEvent = new KeyboardEvent('keydown', event)
        // @ts-ignore - this is an internal event
        internalEvent._blitsInternal = true
        document.dispatchEvent(internalEvent)
      } else {
        focusChain.length = 0
      }
    }, timeoutMs)
  },
  input(key, event) {
    if (state.navigating === true) return

    focusChain = walkChain([focusedComponent], key)
    const componentWithInputEvent = focusChain.shift()
    if (!componentWithInputEvent) return

    const inputEvents = componentWithInputEvent[symbols.inputEvents]
    if (!inputEvents) return

    let cb
    if (inputEvents[key]) {
      cb = inputEvents[key].call(componentWithInputEvent, event)
    } else if (inputEvents.any) {
      cb = inputEvents.any.call(componentWithInputEvent, event)
    }

    if (cb !== undefined) {
      keyUpCallbacks.set(event.code, cb)
    }
  },
}

const walkChain = (components, key) => {
  if (
    components[0][symbols.inputEvents] &&
    (typeof components[0][symbols.inputEvents][key] === 'function' ||
      typeof components[0][symbols.inputEvents].any === 'function')
  ) {
    return components
  } else if (components[0].parent) {
    components.unshift(components[0].parent)
    return walkChain(components, key)
  } else return []
}
