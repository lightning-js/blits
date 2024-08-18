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
  $emit: {
    value: function (event, params) {
      // returning if all listeners executed
      return eventListeners.executeListeners(event, params)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $listen: {
    value: function (event, callback, priority = 0) {
      eventListeners.registerListener(this, event, callback, priority)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
