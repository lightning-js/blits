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

import symbols from '../../lib/symbols.js'

export default {
  $setTimeout: {
    value: function (fn, ms, ...params) {
      const timeoutId = setTimeout(
        () => {
          this[symbols.timeouts] = this[symbols.timeouts].filter((id) => id !== timeoutId)
          fn.apply(null, params)
        },
        ms,
        params
      )
      this[symbols.timeouts].push(timeoutId)
      return timeoutId
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearTimeout: {
    value: function (timeoutId) {
      if (this[symbols.timeouts].indexOf(timeoutId) > -1) {
        this[symbols.timeouts] = this[symbols.timeouts].filter((id) => id !== timeoutId)
        clearTimeout(timeoutId)
      }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearTimeouts: {
    value: function () {
      for (let i = 0; i < this[symbols.timeouts].length; i++) {
        clearTimeout(this[symbols.timeouts][i])
      }
      this[symbols.timeouts] = []
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $setInterval: {
    value: function (fn, ms, ...params) {
      const intervalId = setInterval(() => fn.apply(null, params), ms, params)
      this[symbols.intervals].push(intervalId)
      return intervalId
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearInterval: {
    value: function (intervalId) {
      if (this[symbols.intervals].indexOf(intervalId) > -1) {
        this[symbols.intervals] = this[symbols.intervals].filter((id) => id !== intervalId)
        clearInterval(intervalId)
      }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearIntervals: {
    value: function () {
      for (let i = 0; i < this[symbols.intervals].length; i++) {
        clearInterval(this[symbols.intervals][i])
      }
      this[symbols.intervals] = []
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
