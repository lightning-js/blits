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
import { increment, decrement, BLITS_STATS_ENABLED } from '../../lib/stats.js'

export default {
  $setTimeout: {
    value: function (fn, ms, ...params) {
      // early exit when component is marked as end of life
      if (this.eol === true) return
      const timeoutId = setTimeout(
        () => {
          this[symbols.timeouts] = this[symbols.timeouts].filter((id) => id !== timeoutId)
          BLITS_STATS_ENABLED && decrement('timeouts', 'deleted')
          fn.apply(null, params)
        },
        ms,
        params
      )
      this[symbols.timeouts].push(timeoutId)
      BLITS_STATS_ENABLED && increment('timeouts', 'created')
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
        BLITS_STATS_ENABLED && decrement('timeouts', 'deleted')
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
        BLITS_STATS_ENABLED && decrement('timeouts', 'deleted')
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
      BLITS_STATS_ENABLED && increment('intervals', 'created')
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
        BLITS_STATS_ENABLED && decrement('intervals', 'deleted')
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
        BLITS_STATS_ENABLED && decrement('intervals', 'deleted')
      }
      this[symbols.intervals] = []
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
