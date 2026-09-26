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

import test from 'tape'
import sinon from 'sinon'
import Settings from '../../settings.js'
import symbols from '../../lib/symbols.js'
import { renderer, textRenderEngines } from './launch.js'
import { SdfTextRenderer } from '@lightningjs/renderer/webgl'
import { CanvasTextRenderer } from '@lightningjs/renderer/canvas'
import { resolveFontEngineType, getRequiredFontEngines } from './fontTypes.js'
import fontLoader from './fontLoader.js'

test('resolveFontEngineType - maps Blits font types to renderer font-engine types', (assert) => {
  assert.equal(resolveFontEngineType('msdf'), 'sdf', 'msdf maps to sdf')
  assert.equal(resolveFontEngineType('sdf'), 'sdf', 'sdf maps to sdf')
  assert.equal(resolveFontEngineType('web'), 'canvas', 'web maps to canvas')
  assert.equal(resolveFontEngineType('canvas'), 'canvas', 'canvas maps to canvas')
  assert.equal(resolveFontEngineType('unknown'), 'sdf', 'unknown types default to sdf')
  assert.equal(resolveFontEngineType(undefined), 'sdf', 'missing types default to sdf')
  assert.end()
})

test('getRequiredFontEngines - detects required font engines', (assert) => {
  assert.deepEqual(
    getRequiredFontEngines([
      { family: 'A', type: 'msdf' },
      { family: 'B', type: 'web' },
    ]),
    { hasSdfFont: true, hasCanvasFont: true },
    'mixed fonts require both engines'
  )
  assert.deepEqual(
    getRequiredFontEngines([
      { family: 'A', type: 'msdf' },
      { family: 'B', type: 'sdf' },
    ]),
    { hasSdfFont: true, hasCanvasFont: false },
    'msdf/sdf fonts require only the sdf engine'
  )
  assert.deepEqual(
    getRequiredFontEngines([
      { family: 'A', type: 'web' },
      { family: 'B', type: 'canvas' },
    ]),
    { hasSdfFont: false, hasCanvasFont: true },
    'web/canvas fonts require only the canvas engine'
  )
  assert.deepEqual(
    getRequiredFontEngines([]),
    { hasSdfFont: false, hasCanvasFont: false },
    'no fonts require no engines'
  )
  assert.deepEqual(
    getRequiredFontEngines(),
    { hasSdfFont: false, hasCanvasFont: false },
    'missing fonts require no engines'
  )
  assert.deepEqual(
    getRequiredFontEngines([{ family: 'A', type: 'unknown' }]),
    { hasSdfFont: true, hasCanvasFont: false },
    'unknown types count as sdf (matching fontLoader default)'
  )
  assert.end()
})

test('textRenderEngines - only registers required font engines in webgl mode', (assert) => {
  assert.deepEqual(
    textRenderEngines({ renderMode: 'webgl', fonts: [{ family: 'A', type: 'msdf' }] }),
    [SdfTextRenderer],
    'only SDF engine for msdf-only fonts'
  )
  assert.deepEqual(
    textRenderEngines({ renderMode: 'webgl', fonts: [{ family: 'A', type: 'web' }] }),
    [CanvasTextRenderer],
    'only Canvas engine for web-only fonts'
  )
  assert.deepEqual(
    textRenderEngines({
      renderMode: 'webgl',
      fonts: [
        { family: 'A', type: 'msdf' },
        { family: 'B', type: 'web' },
      ],
    }),
    [SdfTextRenderer, CanvasTextRenderer],
    'both engines for mixed fonts'
  )
  assert.deepEqual(
    textRenderEngines({ renderMode: 'webgl', fonts: [] }),
    [CanvasTextRenderer],
    'canvas engine when no fonts are declared (system fonts)'
  )
  assert.deepEqual(
    textRenderEngines({ renderMode: 'webgl' }),
    [CanvasTextRenderer],
    'canvas engine when fonts setting is missing'
  )
  assert.deepEqual(
    textRenderEngines({ fonts: [{ family: 'A', type: 'msdf' }] }),
    [SdfTextRenderer],
    'defaults to webgl renderMode'
  )
  assert.end()
})

test('textRenderEngines - canvas renderMode only registers the canvas engine', (assert) => {
  assert.deepEqual(
    textRenderEngines({ renderMode: 'canvas', fonts: [{ family: 'A', type: 'msdf' }] }),
    [CanvasTextRenderer],
    'sdf fonts cannot use the canvas core renderer'
  )
  assert.deepEqual(
    textRenderEngines({ renderMode: 'canvas' }),
    [CanvasTextRenderer],
    'canvas engine when no fonts are declared'
  )
  assert.end()
})

/**
 * Run fontLoader with mocked Settings and renderer.stage, restoring both afterwards.
 */
const withFontLoaderMocks = ({ fonts, renderMode }, fn) => {
  const store = Settings[symbols.settings]
  const hadFonts = 'fonts' in store
  const hadRenderMode = 'renderMode' in store
  const prevFonts = store.fonts
  const prevRenderMode = store.renderMode
  const prevStage = renderer.stage

  Settings.set('fonts', fonts)
  Settings.set('renderMode', renderMode)
  const loadFont = sinon.stub().resolves()
  renderer.stage = { loadFont }
  const warn = sinon.stub(console, 'warn')

  try {
    fn({ loadFont, warn })
  } finally {
    warn.restore()
    renderer.stage = prevStage
    if (hadFonts === true) {
      Settings.set('fonts', prevFonts)
    } else {
      delete store.fonts
    }
    if (hadRenderMode === true) {
      Settings.set('renderMode', prevRenderMode)
    } else {
      delete store.renderMode
    }
  }
}

test('fontLoader - loads sdf and canvas fonts in webgl mode', (assert) => {
  withFontLoaderMocks(
    {
      renderMode: 'webgl',
      fonts: [
        { family: 'SdfFont', type: 'msdf', png: 'a.msdf.png', json: 'a.msdf.json' },
        { family: 'CanvasFont', type: 'web', file: 'b.ttf' },
      ],
    },
    ({ loadFont, warn }) => {
      fontLoader()
      assert.equal(loadFont.callCount, 2, 'loads both fonts')
      assert.deepEqual(
        loadFont.firstCall.args,
        ['sdf', { fontFamily: 'SdfFont', atlasUrl: 'a.msdf.png', atlasDataUrl: 'a.msdf.json' }],
        'sdf font loaded via sdf handler'
      )
      assert.deepEqual(
        loadFont.secondCall.args,
        ['canvas', { fontFamily: 'CanvasFont', fontUrl: 'b.ttf' }],
        'web font loaded via canvas handler'
      )
      assert.equal(warn.callCount, 0, 'no warnings in webgl mode')
    }
  )
  assert.end()
})

test('fontLoader - skips sdf fonts with a warning in canvas renderMode', (assert) => {
  withFontLoaderMocks(
    {
      renderMode: 'canvas',
      fonts: [
        { family: 'SdfFont', type: 'msdf', png: 'a.msdf.png', json: 'a.msdf.json' },
        { family: 'CanvasFont', type: 'web', file: 'b.ttf' },
      ],
    },
    ({ loadFont, warn }) => {
      fontLoader()
      assert.equal(loadFont.callCount, 1, 'sdf font is skipped')
      assert.deepEqual(
        loadFont.firstCall.args,
        ['canvas', { fontFamily: 'CanvasFont', fontUrl: 'b.ttf' }],
        'canvas font is still loaded'
      )
      assert.equal(warn.callCount, 1, 'skipped font logs a warning')
      assert.ok(
        warn.firstCall.args[0].includes('SdfFont'),
        'warning mentions the skipped font family'
      )
    }
  )
  assert.end()
})
