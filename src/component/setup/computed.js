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

import { Log } from '../../lib/log.js'

import symbols from '../../lib/symbols.js'

export default (component, computeds) => {
  component[symbols.computedKeys] = []

  for (let computed in computeds) {
    // test for reserved keys?
    if (component[symbols.stateKeys] && component[symbols.stateKeys].indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a state variable`)
    } else if (component[symbols.propKeys] && component[symbols.propKeys].indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (
      component[symbols.methodKeys] &&
      component[symbols.methodKeys].indexOf(computed) > -1
    ) {
      Log.error(`${computed} already exists as a method`)
    } else {
      if (typeof computeds[computed] !== 'function') {
        Log.warn(`${computed} is not a function`)
      }
      component[symbols.computedKeys].push(computed)
      Object.defineProperty(component, computed, {
        get() {
          return computeds[computed].apply(this)
        },
      })
    }
  }
}
