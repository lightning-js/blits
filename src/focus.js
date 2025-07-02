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
    if (component === focusedComponent) return
    clearTimeout(setFocusTimeout)
    focusedComponent && focusedComponent !== component.parent && focusedComponent.unfocus()
    focusChain.reverse().forEach((cmp) => cmp.unfocus())
    if (component !== focusedComponent) {
      setFocusTimeout = setTimeout(
        () => {
          focusedComponent = component
          focusedComponent.lifecycle.state = 'focus'
          if (event instanceof KeyboardEvent) {
            const internalEvent = new KeyboardEvent('keydown', event)
            // @ts-ignore - this is an internal event
            internalEvent[symbols.internalEvent] = true
            document.dispatchEvent(internalEvent)
          } else {
            focusChain = []
          }
        },
        this.hold ? Settings.get('holdTimeout', DEFAULT_HOLD_TIMEOUT_MS) : 0
      )
    }
  },
  input(key, event) {
    if (state.navigating === true) return
    focusChain = walkChain([focusedComponent], key)
    const componentWithInputEvent = focusChain.shift()

    if (componentWithInputEvent) {
      let cb
      if (componentWithInputEvent[symbols.inputEvents][key]) {
        cb = componentWithInputEvent[symbols.inputEvents][key].call(componentWithInputEvent, event)
      } else if (componentWithInputEvent[symbols.inputEvents].any) {
        cb = componentWithInputEvent[symbols.inputEvents].any.call(componentWithInputEvent, event)
      }
      if (cb !== undefined) {
        keyUpCallbacks.set(event.code, cb)
      }
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
