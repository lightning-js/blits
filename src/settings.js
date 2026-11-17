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

import symbols from './lib/symbols.js'

const settings = {
  [symbols.settings]: {},
  // Reacts to Blits-only settings changed at runtime via `this.$settings.set()`.
  onRuntimeSettingChange: null,
  get(key, defaultValue = null) {
    if (key in this[symbols.settings]) {
      return this[symbols.settings][key]
    } else {
      return defaultValue
    }
  },
  set(key, value) {
    if (typeof key === 'object') {
      Object.keys(key).forEach((k) => {
        this.set(k, key[k])
      })
    } else {
      this[symbols.settings][key] = value
      if (typeof this.onRuntimeSettingChange === 'function') {
        this.onRuntimeSettingChange(key, value)
      }
    }
  },
}

export default settings
