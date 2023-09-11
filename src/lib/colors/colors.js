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

import htmlColors from './htmlColors.js'
import { Log } from '../log.js'

export default {
  normalize(color = '') {
    color = color.toString()

    if (color.startsWith('0x')) {
      return color
    }

    const rgbaRegex = /rgba?\((.+)\)/gi
    const hslaRegex = /hsla?\((.+)\)/gi

    // RGB(A) color format
    if (rgbaRegex.test(color)) {
      const match = new RegExp(rgbaRegex).exec(color)
      if (match[1]) {
        color = match[1]
          .split(',')
          .map((c, i) => {
            if (i == 3) {
              c = Math.min(Math.max(Math.round(c * 255), 0), 255)
            }
            return parseInt(c).toString(16).padStart(2, '0')
          })
          .join('')
        return color.padEnd(8, 'f').padStart(10, '0x')
      }
    }
    // HSL(A) color format
    else if (hslaRegex.test(color)) {
      Log.warn('HSL(A) color format is not supported yet')
      return 0xffffffff
    }
    // HTMl name color format
    else if (color in htmlColors) {
      return htmlColors[color]
    }
    // hex rgba format
    else if (color.startsWith('#')) {
      color = color.substring(1)
    }
    if (color.length === 3) {
      color = color
        .split('')
        .map((c) => c + c)
        .join('')
    }

    return color.padEnd(8, 'f').padStart(10, '0x')
  },
}
