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
import { Log } from './lib/log.js'

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
    clearTimeout(setFocusTimeout)

    // early return if already focused
    if (component === focusedComponent) return

    if (focusedComponent === null) {
      focusChain = getAncestors([component])
    }

    // unfocus currently focused components
    if (focusedComponent !== null) {
      if (focusChain[focusChain.length - 1] === component.parent) {
        focusChain.push(component)
      } else {
        const newFocusChain = getAncestors([component])
        let i = focusChain.length
        while (i--) {
          // don't unfocus when part of the new focus chain
          if (newFocusChain.indexOf(focusChain[i]) > -1) break
          focusChain[i].lifecycle.state = 'unfocus'
        }
        focusChain = newFocusChain
      }
    }

    // ensure that all components in the focus path have focus state
    let i = 0
    while (i < focusChain.length - 1) {
      focusChain[i].lifecycle.state = 'focus'
      i++
    }

    // and finally set focus to the leaf component
    setFocusTimeout = setTimeout(
      () => setFocus(component, event),
      this.hold === true ? Settings.get('holdTimeout', DEFAULT_HOLD_TIMEOUT_MS) : 0
    )
  },
  input(key, event) {
    if (state.navigating === true) return

    const componentWithInputEvent = getComponentWithInputEvent(focusedComponent, key)

    if (componentWithInputEvent === null) return

    const inputEvents = componentWithInputEvent[symbols.inputEvents]

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

/**
 * Recursive function that retrieves the ancestors of a component
 * @param {Array} components
 * @returns array components
 */
const getAncestors = (components) => {
  if (components[0].parent !== undefined) {
    components.unshift(components[0].parent)
    return getAncestors(components)
  }
  return components
}

/**
 * Get the component in the ancestors chain that has a handler for a certain key code
 * @param {Object} component
 * @param {String} key
 * @returns component
 */
export const getComponentWithInputEvent = (component, key) => {
  if (
    component[symbols.inputEvents] &&
    (typeof component[symbols.inputEvents][key] === 'function' ||
      typeof component[symbols.inputEvents].any === 'function')
  ) {
    return component
  } else if (component.parent !== undefined) {
    return getComponentWithInputEvent(component.parent, key)
  } else return null
}

/**
 * Set the focus to the Component
 * @param {Object} component  - The component fo focus
 * @param {KeyboardEvent} event - Keyboard event
 */
const setFocus = (component, event) => {
  Log.info(
    '\nFocus chain:\n',
    focusChain.map((c, index) => '\t'.repeat(index) + '↳ ' + c.componentId).join('\n')
  )

  focusedComponent = component
  component.lifecycle.state = 'focus'

  if (event instanceof KeyboardEvent) {
    const internalEvent = new KeyboardEvent('keydown', event)
    // @ts-ignore - this is an internal event
    internalEvent[symbols.internalEvent] = true
    document.dispatchEvent(internalEvent)
  }
}
