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

import Settings from '../../settings.js'
import { renderer } from './launch.js'

const fontTypeMapping = {
  sdf: 'sdf',
  msdf: 'sdf',
  canvas: 'canvas',
  web: 'canvas',
}

export default () => {
  const stage = renderer.stage

  const fonts = Settings.get('fonts', [])
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i]
    const type = fontTypeMapping[font.type] || 'sdf'

    if (type === 'sdf') {
      stage.loadFont('sdf', {
        fontFamily: font.family,
        atlasUrl: font.png || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.png`)),
        atlasDataUrl:
          font.json || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.json`)),
      })
    } else {
      stage.loadFont('canvas', {
        fontFamily: font.family,
        fontUrl: font.file,
      })
    }
  }
}
