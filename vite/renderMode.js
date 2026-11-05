/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BACKENDS_FILE = fileURLToPath(new URL('../src/engines/L3/backends.js', import.meta.url))

// Generated replacement modules for `src/engines/L3/backends.js`, one per
// buildable renderMode.
const GENERATED = {
  canvas: `
import { CanvasCoreRenderer, CanvasTextRenderer } from '@lightningjs/renderer/canvas'
import * as canvasShaders from '@lightningjs/renderer/canvas/shaders'

// Generated at build time by the @lightningjs/blits/vite renderMode plugin
// (blits.renderMode: 'canvas' in vite.config.js). Do not edit directly.
export const lockedRenderMode = 'canvas'
export const coreRenderers = { canvas: CanvasCoreRenderer }
export const textRenderers = { Canvas: CanvasTextRenderer }
export const shaderSets = { canvas: canvasShaders }
export const resolveRenderMode = () => 'canvas'
`,

  webgl: `
import { WebGlCoreRenderer, SdfTextRenderer } from '@lightningjs/renderer/webgl'
import { CanvasTextRenderer } from '@lightningjs/renderer/canvas'
import * as webglShaders from '@lightningjs/renderer/webgl/shaders'

// Generated at build time by the @lightningjs/blits/vite renderMode plugin
// (blits.renderMode: 'webgl' in vite.config.js). Do not edit directly.
export const lockedRenderMode = 'webgl'
export const coreRenderers = { webgl: WebGlCoreRenderer }
export const textRenderers = { Sdf: SdfTextRenderer, Canvas: CanvasTextRenderer }
export const shaderSets = { webgl: webglShaders }
export const resolveRenderMode = () => 'webgl'
`,
}

const normalize = (filePath) => {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

const NORMALIZED_BACKENDS_FILE = normalize(BACKENDS_FILE)

export default function renderMode() {
  let mode = null

  return {
    name: 'blits-render-mode',

    configResolved(resolvedConfig) {
      const configured = resolvedConfig.blits && resolvedConfig.blits.renderMode

      if (configured === undefined) return

      if (configured === 'webgl' || configured === 'canvas') {
        mode = configured
        return
      }

      console.warn(
        `[blits] Ignoring invalid vite.config "blits.renderMode" value: ${JSON.stringify(
          configured
        )}. Expected "webgl" or "canvas" - both backends will be bundled.`
      )
    },

    load(id) {
      if (mode === null) return null
      if (normalize(id.split('?')[0]) !== NORMALIZED_BACKENDS_FILE) return null

      return GENERATED[mode]
    },
  }
}
