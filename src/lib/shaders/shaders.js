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

import { renderer } from '../../engines/L3/launch.js'
import { parseToObject, isObjectString, isArrayString } from '../utils.js'
import colors from '../colors/colors.js'

export default {
  createElementShader(v) {
    let { border, shadow, rounded } = v
    const props = {}
    const hasShadow = shadow !== undefined
    const hasBorder = border !== undefined
    const hasRounded = rounded !== undefined

    if (hasBorder === true && (typeof border === 'object' || isObjectString(border) === true)) {
      border = this.parseProps(border)
      for (const key in border) {
        props[`border-${key}`] = border[key]
      }
    }
    if (hasShadow === true && (typeof shadow === 'object' || isObjectString(shadow) === true)) {
      shadow = this.parseProps(shadow)
      for (const key in shadow) {
        props[`shadow-${key}`] = shadow[key]
      }
    }

    if (hasRounded === true && (typeof rounded === 'object' || isObjectString(rounded) === true)) {
      if (typeof rounded === 'string') {
        rounded = this.parseProps(rounded)
      }
      for (const key in rounded) {
        props[key] = rounded[key]
      }
    } else if (hasRounded === true) {
      if (isArrayString(rounded) === true) {
        rounded = JSON.parse(rounded)
      }
      props['radius'] = rounded
    }

    let type = 'rounded'
    if (hasBorder === true && hasShadow === true) {
      type += 'WithBorderAndShadow'
    } else if (hasBorder) {
      type += 'WithBorder'
    } else if (hasShadow) {
      type += 'WithShadow'
    }
    return renderer.createShader(type, props)
  },
  parseProp(v) {
    if (typeof v === 'number') {
      return v
    }
    if (typeof v === 'string') {
      return colors.normalize(v)
    }
    if (Array.isArray(v) === true) {
      return v.map((i) => this.parseProp(i))
    }
  },
  parseProps(v) {
    if (typeof v === 'string') {
      v = parseToObject(v)
    }
    const keys = Object.keys(v)
    const length = keys.length
    for (let i = 0; i < length; i++) {
      const key = keys[i]
      v[key] = this.parseProp(v[key])
    }
    return v
  },
}
