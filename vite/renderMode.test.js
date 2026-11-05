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

import test from 'tape'
import sinon from 'sinon'
import { fileURLToPath } from 'node:url'
import renderMode from './renderMode.js'

const WEBGL_VARIANT = fileURLToPath(new URL('../src/engines/L3/backends/webgl.js', import.meta.url))
const CANVAS_VARIANT = fileURLToPath(
  new URL('../src/engines/L3/backends/canvas.js', import.meta.url)
)
// A realistic importer: launch.js imports backends/index.js as a relative sibling.
const IMPORTER = fileURLToPath(new URL('../src/engines/L3/launch.js', import.meta.url))
const SOURCE = './backends/index.js'

test('renderMode - resolveId is a no-op when blits.renderMode is not configured', (assert) => {
  const plugin = renderMode()
  plugin.configResolved({})
  assert.equal(plugin.resolveId(SOURCE, IMPORTER), null, 'does not redirect backends/index.js')
  assert.end()
})

test('renderMode - resolveId ignores unrelated specifiers even when a mode is configured', (assert) => {
  const plugin = renderMode()
  plugin.configResolved({ blits: { renderMode: 'webgl' } })
  assert.equal(
    plugin.resolveId('./fontLoader.js', IMPORTER),
    null,
    'leaves unrelated relative imports untouched'
  )
  assert.equal(
    plugin.resolveId('@lightningjs/renderer/webgl', IMPORTER),
    null,
    'leaves bare specifiers untouched'
  )
  assert.end()
})

test('renderMode - resolveId ignores specifiers with no importer (entry points)', (assert) => {
  const plugin = renderMode()
  plugin.configResolved({ blits: { renderMode: 'webgl' } })
  assert.equal(
    plugin.resolveId(SOURCE, undefined),
    null,
    'does not redirect without a resolvable importer'
  )
  assert.end()
})

test('renderMode - redirects backends/index.js to backends/webgl.js when configured', (assert) => {
  const plugin = renderMode()
  plugin.configResolved({ blits: { renderMode: 'webgl' } })
  assert.equal(
    plugin.resolveId(SOURCE, IMPORTER),
    WEBGL_VARIANT,
    'resolves to the real backends/webgl.js file on disk'
  )
  // Also matches a query-suffixed specifier, as Vite/Rollup may append one.
  assert.equal(
    plugin.resolveId(SOURCE + '?import', IMPORTER),
    WEBGL_VARIANT,
    'resolves regardless of a trailing query string'
  )
  assert.end()
})

test('renderMode - redirects backends/index.js to backends/canvas.js when configured', (assert) => {
  const plugin = renderMode()
  plugin.configResolved({ blits: { renderMode: 'canvas' } })
  assert.equal(
    plugin.resolveId(SOURCE, IMPORTER),
    CANVAS_VARIANT,
    'resolves to the real backends/canvas.js file on disk'
  )
  assert.end()
})

test('renderMode - warns and leaves both backends bundled on an invalid value', (assert) => {
  const warn = sinon.stub(console, 'warn')
  try {
    const plugin = renderMode()
    plugin.configResolved({ blits: { renderMode: 'webgpu' } })
    assert.equal(plugin.resolveId(SOURCE, IMPORTER), null, 'does not redirect backends/index.js')
    assert.equal(warn.callCount, 1, 'logs a warning')
    assert.ok(warn.firstCall.args[0].includes('webgpu'), 'warning mentions the invalid value')
  } finally {
    warn.restore()
  }
  assert.end()
})

test('renderMode - different plugin instances keep independent state', (assert) => {
  const webglPlugin = renderMode()
  const canvasPlugin = renderMode()
  webglPlugin.configResolved({ blits: { renderMode: 'webgl' } })
  canvasPlugin.configResolved({ blits: { renderMode: 'canvas' } })

  assert.equal(webglPlugin.resolveId(SOURCE, IMPORTER), WEBGL_VARIANT)
  assert.equal(canvasPlugin.resolveId(SOURCE, IMPORTER), CANVAS_VARIANT)
  assert.end()
})
