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

const baseProp = {
  cast: (v) => v,
  required: false,
}

export default (component, props = []) => {
  if (props.indexOf('id') === -1) {
    props.push('id')
  }
  component.___propKeys = []
  props.forEach((prop) => {
    prop = { ...baseProp, ...(typeof prop === 'object' ? prop : { key: prop }) }
    component.___propKeys.push(prop.key)
    Object.defineProperty(component.prototype, prop.key, {
      get() {
        const value = prop.cast(
          this.___props && prop.key in this.___props
            ? this.___props[prop.key]
            : prop.default || undefined
        )

        if (prop.required && value === undefined) {
          Log.warn(`${prop.key} is required`)
        }

        return value
      },
      set(v) {
        Log.warn(`Warning! Avoid mutating props directly (${prop.key})`)
        this.___props[prop.key] = v
      },
    })
  })
}
