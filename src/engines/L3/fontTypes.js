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

/**
 * Maps a Blits font `type` (as declared in `settings.fonts`) to the
 * renderer font-engine type (`sdf` or `canvas`).
 *
 * Kept in a shared module so `launch.js` (font-engine selection) and
 * `fontLoader.js` (font loading) always agree on the mapping.
 */
const fontTypeMapping = {
  sdf: 'sdf',
  msdf: 'sdf',
  canvas: 'canvas',
  web: 'canvas',
}

/**
 * Resolve a Blits font type to a renderer font-engine type.
 * Unknown (or missing) types default to `sdf`, matching fontLoader behavior.
 *
 * @param {string} [type] - The font type declared in settings (web, msdf, sdf, canvas)
 * @returns {'sdf'|'canvas'}
 */
export const resolveFontEngineType = (type) => fontTypeMapping[type] || 'sdf'

/**
 * Scan the configured fonts and report which font-engine types are required.
 *
 * @param {Array<{ type?: string }>} [fonts] - Fonts declared in settings
 * @returns {{ hasSdfFont: boolean, hasCanvasFont: boolean }}
 */
export const getRequiredFontEngines = (fonts = []) => {
  let hasSdfFont = false
  let hasCanvasFont = false

  const len = Array.isArray(fonts) ? fonts.length : 0
  for (let i = 0; i < len; i++) {
    if (resolveFontEngineType(fonts[i] && fonts[i].type) === 'sdf') {
      hasSdfFont = true
    } else {
      hasCanvasFont = true
    }
    if (hasSdfFont === true && hasCanvasFont === true) break
  }

  return { hasSdfFont, hasCanvasFont }
}
