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

import Element from './element.js'
import Launch, { renderer } from './launch.js'
import colors from '../../lib/colors/colors.js'
import { SCREEN_RESOLUTIONS, RENDER_QUALITIES } from '../../constants.js'

/**
 * Maps Blits setting keys to renderer runtime options
 *
 * @type {Record<string, (value: any) => Partial<import('@lightningjs/renderer').RendererRuntimeSettings>>}
 */
const rendererOptions = {
  // defaults to transparent (same as on launch) for empty or invalid colors
  w: (v) => ({ appWidth: v }),
  h: (v) => ({ appHeight: v }),
  screenResolution: (v) => ({
    deviceLogicalPixelRatio: typeof v === 'string' ? (SCREEN_RESOLUTIONS[v] ?? 1) : v,
  }),
  renderQuality: (v) => ({
    devicePhysicalPixelRatio: RENDER_QUALITIES[v] ?? v ?? 1,
  }),
  canvasColor: (v) => ({ clearColor: Number(colors.normalize(v ?? '', '0x00000000')) }),
  fpsInterval: (v) => ({ fpsUpdateInterval: v }),
  pixelRatio: (v) => ({ deviceLogicalPixelRatio: v }),
  viewportMargin: (v) => ({ boundsMargin: v }),
  maxFPS: (v) => ({ targetFPS: v }),
}

/**
 * Applies a runtime setting to the renderer via RendererMain.setOptions()
 *
 * @param {string} key - Blits setting key (validated by $settings)
 * @param {any} value - New value
 */
const updateSetting = (key, value) => renderer?.setOptions?.(rendererOptions[key](value))

export default {
  Element,
  Launch,
  updateSetting,
}
