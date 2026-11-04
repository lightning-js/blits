/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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

import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

function getVersions() {
  const blits = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  // Resolve the public entry: the renderer does not export its package.json.
  // Walk upwards to support hoisted, nested, and symlinked installations.
  let directory = dirname(require.resolve('@lightningjs/renderer'))
  while (true) {
    const filename = join(directory, 'package.json')
    if (existsSync(filename)) {
      const pkg = JSON.parse(readFileSync(filename, 'utf8'))
      if (pkg.name === '@lightningjs/renderer') {
        return { blits: blits.version, renderer: pkg.version }
      }
    }
    const parent = dirname(directory)
    if (parent === directory) throw new Error('Unable to locate @lightningjs/renderer/package.json')
    directory = parent
  }
}

export default function injectVersions() {
  return {
    name: 'inject-versions',
    config(config) {
      const versions = getVersions()
      return {
        define: {
          __BLITS_VERSION__: JSON.stringify(versions.blits || 'unknown'),
          __RENDERER_VERSION__: JSON.stringify(versions.renderer || 'unknown'),
          // merge any existing define block
          ...config.define,
        },
      }
    },
  }
}
