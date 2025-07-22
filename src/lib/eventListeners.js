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

import symbols from './symbols.js'
import { getRaw } from './reactivity/reactive.js'

const eventsMap = new Map()
const callbackCache = new Map()

function isProxy(obj) {
  return obj && typeof obj === 'object' && obj[symbols.isProxy] === true
}

function deepUnproxyClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  const raw = isProxy(obj) ? getRaw(obj) : obj
  const result = Array.isArray(raw) ? [] : {}

  for (const key of Object.keys(raw)) {
    const value = raw[key]
    result[key] = value && typeof value === 'object' ? deepUnproxyClone(value) : value
  }

  return result
}

export default {
  /**
   * Registers a listener callback for a specific event on a component.
   *
   * @param {object} component - The component instance to register the listener for.
   * @param {string} event - The name of the event to listen for.
   * @param {Function} cb - The callback function to execute when the event is emitted.
   * @param {number} [priority=0] - The priority of the listener (higher runs first).
   * @returns {void}
   */
  registerListener(component, event, cb, priority = 0) {
    let componentsMap = eventsMap.get(event)
    if (componentsMap === undefined) {
      componentsMap = new Map()
      eventsMap.set(event, componentsMap)
    }

    let components = componentsMap.get(component)
    if (components === undefined) {
      components = new Set()
      componentsMap.set(component, components)
    }

    components.add({ cb, priority })
    callbackCache.delete(event) // Invalidate the callbackCache when a new callback is added
  },

  /**
   * Deregisters a listener for a specific event on a component.
   *
   * @param {object} component - The component instance to deregister the listener for.
   * @param {string} event - The name of the event to stop listening for.
   * @returns {void}
   */
  deregisterListener(component, event) {
    let componentsMap = eventsMap.get(event)
    if (componentsMap === undefined) {
      return
    }

    if (componentsMap.has(component)) {
      componentsMap.delete(component)
      eventsMap.set(event, componentsMap)
      callbackCache.delete(event)
    }
  },

  /**
   * Executes all registered listeners for a given event, in priority order.
   *
   * @param {string} event - The name of the event to emit.
   * @param {any} params - The parameters to pass to the event listeners.
   * @param byReference - whether or not to pass the data by reference.
   * The default behaviour is passing the data object by reference (`true`).
   * When explicitely passing `false` the object will be recursively cloned
   * and cleaned from any potential reactivity before emitting
   * @returns {boolean} True if all listeners executed without stopping propagation, false if any listener returned false.
   */
  executeListeners(event, params, byReference) {
    if (byReference === false) {
      params = deepUnproxyClone(params)
    }
    const componentsMap = eventsMap.get(event)
    if (componentsMap === undefined || componentsMap.size === 0) {
      return true // No listeners, so execution can be considered successful
    }

    if (callbackCache.has(event) === false) {
      const allCallbacks = []
      for (const [component, components] of componentsMap) {
        for (const callbackObj of components) {
          allCallbacks.push({ ...callbackObj, component })
        }
      }
      allCallbacks.sort((a, b) => b.priority - a.priority)
      callbackCache.set(event, allCallbacks) // callbackCache the sorted callbacks with component context
    }

    const callbacks = callbackCache.get(event)
    for (let i = 0; i < callbacks.length; i++) {
      const { cb, component } = callbacks[i]
      const result = cb.call(component, params)
      if (result === false) {
        return false // Stop propagation if any listener returns false
      }
    }

    return true // All listeners executed without stopping propagation
  },

  /**
   * Removes all listeners for a given component from all events.
   *
   * @param {object} component - The component instance to remove listeners for.
   * @returns {void}
   */
  removeListeners(component) {
    for (const [event, componentsMap] of eventsMap) {
      if (componentsMap.has(component)) {
        componentsMap.delete(component)
        callbackCache.delete(event) // Invalidate the callbackCache for this event

        // If no more components for this event, remove the event entirely
        if (componentsMap.size === 0) {
          eventsMap.delete(event)
        }
      }
    }
  },
}
