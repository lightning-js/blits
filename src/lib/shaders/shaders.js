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

const parseBorder = (border, props = {}, prefixed = false) => {
  const prefix = prefixed === true ? 'border-' : ''
  if (isNaN(border) === false) {
    props[prefix + 'w'] = border
    return
  }
  if (Array.isArray(border) === true) {
    props[prefix + 'w'] = border
    return
  }
  if (isArrayString(border) === true) {
    props[prefix + 'w'] = JSON.parse(border)
    return
  }
  if (typeof border === 'object' || isObjectString(border) === true) {
    border = typeof border === 'string' ? parseToObject(border) : border
    for (const key in border) {
      props[prefix + key] = border[key]
    }
    return
  }
}

const parseShadow = (shadow, props = {}, prefixed = false) => {
  const prefix = prefixed === true ? 'shadow-' : ''
  if (Array.isArray(shadow) === true) {
    props[prefix + 'projection'] = shadow
    return
  }
  if (isArrayString(shadow) === true) {
    props[prefix + 'projection'] = JSON.parse(shadow)
    return
  }
  if (typeof shadow === 'object' || isObjectString(shadow) === true) {
    shadow = typeof shadow === 'string' ? parseToObject(shadow) : shadow
    for (const key in shadow) {
      props[prefix + key] = shadow[key]
    }
    return
  }
}

const parseRounded = (rounded, props = {}) => {
  if (isNaN(rounded) === false) {
    props.radius = rounded
    return
  }
  if (Array.isArray(rounded) === true) {
    props.radius = rounded
    return
  }
  if (isArrayString(rounded) === true) {
    props.radius = JSON.parse(rounded)
    return
  }
  if (typeof rounded === 'object' || isObjectString(rounded) === true) {
    rounded = typeof rounded === 'string' ? parseToObject(rounded) : rounded
    for (const key in rounded) {
      props[key] = rounded[key]
    }
    return
  }
}

export default {
  createElementProps(v) {
    let { border, shadow, rounded } = v
    const props = {}
    const hasRounded = rounded !== undefined
    const hasBorder = border !== undefined
    const hasShadow = shadow !== undefined

    if (border !== undefined) {
      parseBorder(border, props, hasRounded || hasShadow)
    }

    if (shadow !== undefined) {
      parseShadow(shadow, props, hasRounded || hasBorder)
    }

    if (hasRounded === true) {
      parseRounded(rounded, props)
    }
    return props
  },
  createElementShader(v) {
    let { border, shadow, rounded } = v
    const props = this.createElementProps(v)
    const hasShadow = shadow !== undefined
    const hasBorder = border !== undefined
    const hasRounded = rounded !== undefined

    if (hasBorder === true && hasShadow === true) {
      return renderer.createShader('roundedWithBorderAndShadow', props)
    }

    if (hasRounded === true) {
      if (hasBorder === true) {
        return renderer.createShader('roundedWithBorder', props)
      }

      if (hasShadow === true) {
        return renderer.createShader('roundedWithShadow', props)
      }

      return renderer.createShader('rounded', props)
    }

    if (hasRounded === false && hasBorder === true) {
      return renderer.createShader('border', props)
    }

    //only possible result left
    return renderer.createShader('shadow', props)
  },
  parseProp(v) {
    if (typeof v === 'number') {
      return v
    }
    if (typeof v === 'string') {
      return colors.normalize(v, v)
    }
    if (Array.isArray(v) === true) {
      return v.map((i) => this.parseProp(i))
    }
    return v
  },
  parseProps(v) {
    if (typeof v === 'string') {
      v = parseToObject(v)
    }
    const keys = Object.keys(v)
    const length = keys.length
    for (let i = 0; i < length; i++) {
      const key = keys[i]
      if (key === 'type') {
        continue
      }
      v[key] = this.parseProp(v[key])
    }
    return v
  },
}
