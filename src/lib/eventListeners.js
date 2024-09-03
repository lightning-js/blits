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

const eventsMap = new Map()
const callbackCache = new Map()

export default {
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

  executeListeners(event, params) {
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
