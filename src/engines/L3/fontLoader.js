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

import { SdfTrFontFace, WebTrFontFace } from '@lightningjs/renderer'
import Settings from '../../settings.js'
import { renderer } from './launch.js'

export default () => {
  const stage = renderer.stage
  Settings.get('fonts', []).forEach((font) => {
    if (font.type === 'sdf' || font.type === 'msdf') {
      // automatically map png key to file name
      if (!font.png && font.file) {
        font.png = font.file.replace(/\.[^.]+$/, `.${font.type}.png`)
      }
      // automatically map json to file name
      if (!font.json && font.file) {
        font.json = font.file.replace(/\.[^.]+$/, `.${font.type}.json`)
      }
      stage.fontManager.addFontFace(
        new SdfTrFontFace(font.type, {
          fontFamily: font.family,
          descriptors: {},
          atlasUrl: font.png,
          atlasDataUrl: font.json,
          stage,
          metrics: font.metrics,
        })
      )
    } else if (font.type === 'web') {
      stage.fontManager.addFontFace(
        new WebTrFontFace({
          fontFamily: font.family,
          fontUrl: font.file,
          descriptors: {},
          metrics: font.metrics,
        })
      )
    }
  })
}
