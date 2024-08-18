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

export default {
  registerListener(component, event, cb, priority = 0) {
    let listeners = eventsMap.get(event)
    if (!listeners) {
      listeners = []
      eventsMap.set(event, listeners)
    }

    // Check if the callback already exists for this component
    const exists = listeners.some(
      (listener) => listener.component === component && listener.callback === cb
    )

    if (!exists) {
      // Only add the listener if it doesn't already exist
      listeners.push({ component, callback: cb, priority })
      listeners.sort((a, b) => b.priority - a.priority)
    }
    // If it exists, do nothing
  },

  executeListeners(event, params) {
    console.log('Event:', event, 'Params:', params)
    const listeners = eventsMap.get(event)
    if (listeners) {
      for (const { component, callback, priority } of listeners) {
        const result = callback.call(component, params)
        if (result === false) {
          return false // Stop propagation if any listener returns false
        }
      }
    }
    return true // All listeners executed
  },

  removeListeners(component) {
    eventsMap.forEach((listeners, event) => {
      const updatedListeners = listeners.filter((listener) => listener.component !== component)
      if (updatedListeners.length === 0) {
        eventsMap.delete(event)
      } else {
        eventsMap.set(event, updatedListeners)
      }
    })
  },
}
