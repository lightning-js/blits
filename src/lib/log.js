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

import Settings from '../settings.js'

const n = () => {}

const pad = (n) => String(n).padStart(2, '0')

/**
 * Returns the current time as a locale time string (hh:mm:ss).
 * @returns {string} The current time string.
 */
const time = () => {
  const now = new Date()
  return pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
}

/**
 * Returns a logger object for the given context, with info, warn, debug, and error methods.
 * Logging methods are no-ops if the debug level does not match.
 *
 * @param {string} context - The context label for log messages.
 * @returns {Object} Logger object with info, warn, debug, and error methods.
 */
const logger = (context) => {
  const level = Settings.get('debugLevel')
  const log = {}

  Object.defineProperty(log, 'info', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('info') > -1)) &&
          console.info.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #0284c7; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'warn', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('warn') > -1)) &&
          console.warn.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #fbbf24; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'error', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('error') > -1)) &&
          console.error.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #dc2626; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'debug', {
    get() {
      return (
        ((level >= 2 || (Array.isArray(level) && level.indexOf('debug') > -1)) &&
          console.debug.bind(
            window.console,
            `%c ⚡️ ${context} %c (${new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })})`,
            'background-color: #e2e8f0; color: #334155; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  return log
}

export default logger

export let Log
// review this pattern
export const initLog = () => {
  Log = logger('Blits')
}
