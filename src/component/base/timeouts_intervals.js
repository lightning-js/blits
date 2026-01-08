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
      // early exit when component is marked as end of life
      if (this.eol === true) return

      const timeoutId = setTimeout(
        () => {
          this.$clearTimeout(timeoutId)
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
      const index = this[symbols.timeouts].indexOf(timeoutId)
      if (index > -1) {
        this[symbols.timeouts].splice(index, 1)
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
      // early exit when component is marked as end of life
      if (this.eol === true) return
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
      const index = this[symbols.intervals].indexOf(intervalId)
      if (index > -1) {
        this[symbols.intervals].splice(index, 1)
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
  $debounce: {
    value: function (name, fn, ms, ...params) {
      // early exit when component is marked as end of life
      if (this.eol === true) return

      // clear existing debounce for this name if it exists
      const existing = this[symbols.debounces].get(name)
      if (existing !== undefined) {
        this.$clearTimeout(existing)
        this[symbols.debounces].delete(name)
      }

      // create new timeout
      const timeoutId = setTimeout(() => {
        this[symbols.debounces].delete(name)
        this.$clearTimeout(timeoutId)
        fn.apply(this, params)
      }, ms)

      // track timeout in timeouts array for automatic cleanup
      this[symbols.timeouts].push(timeoutId)

      // store timeoutId per name to enable replace behavior and lifecycle cleanup
      this[symbols.debounces].set(name, timeoutId)

      return timeoutId
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearDebounce: {
    value: function (name) {
      const existing = this[symbols.debounces].get(name)
      if (existing !== undefined) {
        this.$clearTimeout(existing)
        this[symbols.debounces].delete(name)
      }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $clearDebounces: {
    value: function () {
      // clear all timeouts associated with debounces
      const timeoutIds = Array.from(this[symbols.debounces].values())
      for (let i = 0; i < timeoutIds.length; i++) {
        this.$clearTimeout(timeoutIds[i])
      }
      this[symbols.debounces].clear()
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
