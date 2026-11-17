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
import { initLog } from '../../lib/log.js'
import { deriveMsdfAsset, resolveFontEngine, createFontRegistry, engineTextType } from './fonts.js'

initLog()

test('fonts - deriveMsdfAsset follows L3 convention', (assert) => {
  assert.equal(
    deriveMsdfAsset('fonts/Lato-Regular.ttf', '.msdf.png'),
    'fonts/Lato-Regular.msdf.png',
    'ttf base swapped'
  )
  assert.equal(
    deriveMsdfAsset('fonts/Lato-Regular.ttf', '.msdf.json'),
    'fonts/Lato-Regular.msdf.json',
    'json derivation'
  )
  assert.equal(deriveMsdfAsset(undefined, '.msdf.png'), undefined, 'no file -> undefined')
  assert.equal(deriveMsdfAsset('', '.msdf.png'), undefined, 'empty file -> undefined')
  assert.end()
})

test('fonts - resolveFontEngine msdf branch', (assert) => {
  assert.deepEqual(
    resolveFontEngine({ family: 'lato', type: 'msdf', file: 'fonts/Lato-Regular.ttf' }),
    {
      engine: 'msdf',
      family: 'lato',
      atlas: 'fonts/Lato-Regular.msdf.png',
      fontData: 'fonts/Lato-Regular.msdf.json',
    },
    'msdf + file derives atlas pair'
  )
  assert.deepEqual(
    resolveFontEngine({
      family: 'x',
      type: 'msdf',
      file: 'fonts/X.ttf',
      png: 'custom/a.png',
      json: 'custom/a.json',
    }).atlas,
    'custom/a.png',
    'explicit png wins'
  )
  assert.deepEqual(
    resolveFontEngine({ family: 'x', type: 'sdf', file: 'fonts/X.ttf' }).engine,
    'msdf',
    'sdf collapses onto msdf engine'
  )
  assert.end()
})

test('fonts - resolveFontEngine canvas branch', (assert) => {
  assert.deepEqual(
    resolveFontEngine({ family: 'open', type: 'web', file: 'fonts/Open.ttf' }),
    { engine: 'canvas', family: 'open', url: 'fonts/Open.ttf' },
    'web type loads file into canvas'
  )
  assert.deepEqual(
    resolveFontEngine({ family: 'lato', type: 'msdf', file: 'fonts/Lato.ttf' }, 'canvas').engine,
    'canvas',
    'renderMode canvas forces canvas engine'
  )
  const skipped = resolveFontEngine({ family: 'ghost', type: 'msdf' })
  assert.equal(skipped.skipped, 'no-loadable-file', 'atlas-only msdf without file skips')
  assert.end()
})

test('fonts - registry', (assert) => {
  const registry = createFontRegistry()
  assert.equal(registry.engineOf('lato'), undefined, 'unknown family')
  registry.register('lato', 'msdf')
  assert.equal(registry.engineOf('lato'), 'msdf', 'registered lookup')
  assert.equal(registry.engineOf(undefined), undefined, 'undefined family safe')
  registry.clear()
  assert.equal(registry.engineOf('lato'), undefined, 'cleared')
  assert.end()
})

test('fonts - engineTextType mirrors FTL textTypes', (assert) => {
  assert.equal(engineTextType.canvas, 0, 'canvas is 0')
  assert.equal(engineTextType.msdf, 1, 'msdf is 1')
  assert.end()
})
