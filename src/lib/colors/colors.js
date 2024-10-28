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

import colorsMap from './htmlColors.js'

const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const rgba =
  /^(rgba?)\((\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*),(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*),(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*)(,(\s*(-?\d+(?:\.\d+)?)\s*))?\)$/
const hsla =
  /^(hsla?)\((\s*(360|3[0-5][0-9]|[12]?[0-9]{1,2})\s*),(\s*(100|[1-9]?[0-9])\s*)%,(\s*(100|[1-9]?[0-9])\s*)%(,(\s*(1|0(?:\.\d+)?)\s*))?\)$/

const hexLookup = {}

const decimalToHex = (decimal) => {
  if (hexLookup[decimal] !== undefined) {
    return hexLookup[decimal]
  }

  const resp = parseInt(decimal).toString(16).padStart(2, '0')
  hexLookup[decimal] = resp
  return resp
}

export default {
  normalize: (color = '', defaultColor = '0xffffffff') => {
    color = color.toString()

    // it is a 0xRRGGBBAA color, return it
    if (color.startsWith('0x') && color.length === 10) {
      return color
    }

    // it is a previously mapped color, return it
    if (colorsMap[color] !== undefined) {
      return colorsMap[color]
    }

    // check for hex color
    if (hex.test(color)) {
      color = color.replace('#', '').toLowerCase()
      if (color.length === 3) {
        color = color
          .split('')
          .map((c) => c + c)
          .join('')
      }

      const colorRGBA = '0x' + color.padEnd(8, 'f')
      colorsMap[color] = colorRGBA
      return colorRGBA
    }

    //rgb/a
    const rgbaMatch = rgba.exec(color)
    if (rgbaMatch) {
      const r = decimalToHex(rgbaMatch[3])
      const g = decimalToHex(rgbaMatch[5])
      const b = decimalToHex(rgbaMatch[7])
      let a = 'ff'

      if (rgbaMatch[10] && rgbaMatch[1] === 'rgba') {
        const alpha = Math.min(Math.max(Math.round(parseFloat(rgbaMatch[10]) * 255), 0), 255)
        a = decimalToHex(alpha)
      }

      const resp = '0x' + r + g + b + a
      colorsMap[color] = resp
      return resp
    }

    if (hsla.test(color)) {
      console.warn('HSL(A) color format is not supported yet')
      return '0xffffffff'
    }

    return defaultColor
  },
}
