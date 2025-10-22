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

const normalizeProps = (props) => {
  Log.warn(
    'Defining props as an Array has been deprecated and will stop working in future versions. Please use the new notation instead (an object with key values pairs).',
    props
  )
  const out = {}
  const propLength = props.length
  for (let i = 0; i < propLength; i++) {
    const prop = props[i]
    if (typeof prop === 'string') {
      out[prop] = undefined
    } else {
      Log.error(
        'Defining props as an array of objects is no longer supported. Please use the new format: an object with key-value pairs.'
      )
      break
    }
  }
  return out
}

export default (component, props = {}) => {
  if (Array.isArray(props) === true) {
    props = normalizeProps(props)
  }
  if (!('ref' in props)) {
    props.ref = undefined
  }
  const keys = Object.keys(props)
  component[symbols.propKeys] = keys

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const defaultPropValue = props[key]

    Object.defineProperty(component, key, {
      get() {
        if (this[symbols.props] === undefined) return undefined
        // if the key is specified independent of the value (falsy, null, undefined) use that value
        // otherwise return the default prop value
        return key in this[symbols.props] ? this[symbols.props][key] : defaultPropValue
      },
      set(v) {
        Log.warn(
          `Warning! Avoid mutating props directly (prop "${key}" in component "${this.componentId}")`
        )
        this[symbols.props][key] = v
      },
    })
  }
}
