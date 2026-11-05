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

// Resolved relative to this plugin file (not process.cwd()), so it works
// whether Blits is installed in node_modules, hoisted, or symlinked.
const BACKENDS_INDEX = fileURLToPath(
  new URL('../src/engines/L3/backends/index.js', import.meta.url)
)

const VARIANTS = {
  webgl: fileURLToPath(new URL('../src/engines/L3/backends/webgl.js', import.meta.url)),
  canvas: fileURLToPath(new URL('../src/engines/L3/backends/canvas.js', import.meta.url)),
}

// Windows paths are case-insensitive; normalize before comparing.
const normalize = (filePath) => {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

const NORMALIZED_BACKENDS_INDEX = normalize(BACKENDS_INDEX)

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

    // Redirects the internal backends/index.js import to the single-backend
    // variant file on disk.
    resolveId(source, importer) {
      if (mode === null || importer === undefined) return null

      const resolved = normalize(path.resolve(path.dirname(importer), source.split('?')[0]))
      if (resolved !== NORMALIZED_BACKENDS_INDEX) return null

      return VARIANTS[mode]
    },
  }
}
