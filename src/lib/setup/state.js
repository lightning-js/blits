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

import { Log } from '../log.js'

import symbols from '../symbols.js'

export default (component, state) => {
  component[symbols.stateKeys] = []

  state = { ...state.apply(component.prototype), ...{ hasFocus: false } }
  Object.keys(state).forEach((key) => {
    if (component[symbols.propKeys] && component[symbols.propKeys].indexOf(key) > -1) {
      Log.error(`State ${key} already exists as a prop`)
    }
    if (component[symbols.methodKeys] && component[symbols.methodKeys].indexOf(key) > -1) {
      Log.error(`State ${key} already exists as a method`)
    }
    component[symbols.stateKeys].push(key)
    try {
      Object.defineProperty(component.prototype, key, {
        get() {
          return this[symbols.state] && key in this[symbols.state] && this[symbols.state][key]
        },
        set(v) {
          if (this[symbols.state]) this[symbols.state][key] = v
        },
      })
    } catch (e) {
      Log.error(e)
    }
  })
}
