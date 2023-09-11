/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import { Log } from '../log.js'

export default (component, computeds) => {
  component.___computedKeys = []

  for (let computed in computeds) {
    // test for reserved keys?
    if (component.___stateKeys && component.___stateKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (component.___propKeys && component.___propKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (component.___methodKeys && component.___methodKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a method`)
    } else {
      if (typeof computeds[computed] !== 'function') {
        Log.warn(`${computed} is not a function`)
      }
      component.___computedKeys.push(computed)
      Object.defineProperty(component.prototype, computed, {
        get() {
          return computeds[computed].apply(this)
        },
      })
    }
  }
}
