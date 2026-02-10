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

import { Log } from '../lib/log.js'
import { reactive } from '../lib/reactivity/reactive.js'

import Settings from '../settings.js'

const getValueByDotNotation = (obj, base, variant, path) => {
  const keys = path.split('.')

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (variant !== null && key in variant === true) {
      obj = variant[key]
      variant = variant !== null && key in variant === true ? variant[key] : null
      base = base !== null && key in base === true ? base[key] : null
    } else if (obj !== null && key in obj === true) {
      obj = obj[key]
      base = base !== null && key in base === true ? base[key] : null
    }
    // see if the key is present in the base object
    else if (base !== null && key in base === true) {
      base = base[key]
      obj = base
    } else {
      obj = undefined
      break
    }
  }

  return obj
}

export default {
  name: 'theme',
  plugin(config = {}) {
    let themeMap = {}

    const state = reactive(
      {
        current: 'default',
        variant: null,
      },
      Settings.get('reactivityMode'),
      true
    )

    let themes = {}
    let base = null
    if ('themes' in config === true) {
      themes = config.themes
      state.current = config.current || 'default'
      base = config.base || 'default'
      state.variant = config.variant || null
    } else {
      themes = { default: config }
    }

    return {
      get(key, fallback) {
        // reference state.current, to trigger reactive effects for
        // theme get function when current theme is modified
        state.current
        state.variant
        if (themeMap[key] !== undefined) return themeMap[key]
        const value = getValueByDotNotation(
          themes[state.current],
          themes[base] || null,
          themes[state.variant] || null,
          key
        )
        if (value !== undefined) {
          // store the value for next time
          themeMap[key] = value
          return value
        }
        return fallback
      },

      set(theme) {
        Log.warn('$theme.set() is deprecated, use $theme.current() instead')
        this.current(theme)
      },

      current(theme) {
        if (theme in themes) {
          themeMap = {}
          state.current = theme
        } else {
          Log.warn(`Theme ${theme} not found`)
        }
      },

      variant(theme) {
        if (theme in themes) {
          themeMap = {}
          state.variant = theme
          console.log('change variant', theme)
        } else {
          Log.warn(`Variant ${theme} not found`)
        }
      },
    }
  },
}
