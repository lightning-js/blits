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

import { Log } from '../lib/log'
import { reactive } from '../lib/reactivity/reactive.js'

const getValueByDotNotation = (obj, base, path) => {
  const keys = path.split('.')

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (obj !== null && key in obj === true) {
      obj = obj[key]
      base = base[key]
    }
    // see if the key is present in the base object
    else if (base !== null && key in base === true) {
      base = base[key]
      obj = base
    } else {
      obj = undefined
    }
  }

  return obj
}

export default {
  name: 'theme',
  plugin(config = {}) {
    let themeMap = {}

    const state = reactive({
      current: 'default',
    })

    let themes = {}
    let base = null
    if ('themes' in config === true) {
      themes = config.themes
      state.current = config.current || 'default'
      base = config.base || 'default'
    } else {
      themes = { default: config }
    }

    return {
      get(key, fallback) {
        // reference state.current, to trigger reactive effects for
        // theme get function when current theme is modified
        state.current
        if (themeMap[key] !== undefined) return themeMap[key]
        const value = getValueByDotNotation(themes[state.current], themes[base], key)
        if (value !== undefined) {
          // store the value for next time
          themeMap[key] = value
          return value
        }
        return fallback
      },

      set(theme) {
        if (theme in themes) {
          themeMap = {}
          state.current = theme
        } else {
          Log.warn(`Theme ${theme} not found`)
        }
      },
    }
  },
}
