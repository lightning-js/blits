/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import eventListeners from '../../lib/eventListeners.js'

export default {
  /**
   * Emits an event to all registered listeners for the given event name.
   *
   * @param {string} event - The name of the event to emit.
   * @param {any} params - The parameters to pass to the event listeners.
   * @param byReference - whether or not to pass the data by reference.
   * The default behaviour is passing the data object by reference (`true`).
   * When explicitely passing `false` the object will be recursively cloned
   * and cleaned from any potential reactivity before emitting
   * @returns {boolean} True if all listeners executed, false otherwise.
   */
  $emit: {
    value: function (event, params, byReference = true) {
      // early exit when component is marked as end of life
      if (this.eol === true) return
      // returning if all listeners executed
      return eventListeners.executeListeners(event, params, byReference)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  /**
   * Registers a listener callback for a specific event.
   *
   * @param {string} event - The name of the event to listen for.
   * @param {Function} callback - The callback function to execute when the event is emitted.
   * @param {number} [priority=0] - The priority of the listener (higher runs first).
   * @returns {void}
   */
  $listen: {
    value: function (event, callback, priority = 0) {
      // early exit when component is marked as end of life
      if (this.eol === true) return
      eventListeners.registerListener(this, event, callback, priority)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  /**
   * Deregisters a listener for a specific event.
   *
   * @param {string} event - The name of the event to stop listening for.
   * @returns {void}
   */
  $unlisten: {
    value: function (event) {
      eventListeners.deregisterListener(this, event)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },

  /**
   * Removes all listeners for this component from all events.
   *
   * @returns {void}
   */
  $clearListeners: {
    value: function () {
      eventListeners.removeListeners(this)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
