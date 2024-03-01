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

import htmlColors from './htmlColors.js'
import { Log } from '../log.js'

export default {
  // defaultColor must be null when using this function in the template parser
  // because the template parser need to check attribute values (even they are not color codes)
  // to see if it is a color value or not
  normalize(color = '', defaultColor = '0xffffffff') {
    color = color.toString()

    if (color.length > 0) {
      const normalized = /^0x[0-9a-f]{8}$/
      const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
      const rgba =
        /^(rgba?)\((\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*),(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*),(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*)(,(\s*(-?\d+(?:\.\d+)?)\s*))?\)$/
      const hsla =
        /^(hsla?)\((\s*(360|3[0-5][0-9]|[12]?[0-9]{1,2})\s*),(\s*(100|[1-9]?[0-9])\s*)%,(\s*(100|[1-9]?[0-9])\s*)%(,(\s*(1|0(?:\.\d+)?)\s*))?\)$/

      if (normalized.test(color)) {
        return color
      }

      if (hex.test(color)) {
        color = color.replace('#', '').toLowerCase()
        if (color.length === 3) {
          color = color
            .split('')
            .map((c) => c + c)
            .join('')
        }

        return '0x' + color.padEnd(8, 'f')
      }

      //rgb/a
      const rgbaMatch = rgba.exec(color)
      if (rgbaMatch) {
        return (
          '0x' +
          parseInt(rgbaMatch[3]).toString(16).padStart(2, '0') +
          parseInt(rgbaMatch[5]).toString(16).padStart(2, '0') +
          parseInt(rgbaMatch[7]).toString(16).padStart(2, '0') +
          (rgbaMatch[10] && rgbaMatch[1] === 'rgba'
            ? Math.min(Math.max(Math.round(parseFloat(rgbaMatch[10]) * 255), 0), 255)
                .toString(16)
                .padStart(2, '0')
            : 'ff')
        )
      }

      if (hsla.test(color)) {
        Log.warn('HSL(A) color format is not supported yet')
        return '0xffffffff'
      }

      if (color in htmlColors) {
        return htmlColors[color]
      }
    }

    return defaultColor
  },
}
