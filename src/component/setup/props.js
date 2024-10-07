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

const baseProp = {
  cast: (v) => v,
  required: false,
}

export default (component, props = []) => {
  if (props.indexOf('ref') === -1) {
    props.push('ref')
  }
  component[symbols.propKeys] = []

  const propsLength = props.length

  for (let i = 0; i < propsLength; i++) {
    const prop = { ...baseProp, ...(typeof props[i] === 'object' ? props[i] : { key: props[i] }) }
    component[symbols.propKeys].push(prop.key)
    Object.defineProperty(component, prop.key, {
      get() {
        const value = prop.cast(
          this[symbols.props] !== undefined && prop.key in this[symbols.props]
            ? this[symbols.props][prop.key]
            : 'default' in prop
            ? prop.default
            : undefined
        )

        if (prop.required === true && value === undefined) {
          Log.warn(`${prop.key} is required`)
        }

        return value
      },
      set(v) {
        Log.warn(`Warning! Avoid mutating props directly (${prop.key})`)
        this[symbols.props][prop.key] = v
      },
    })
  }
}
