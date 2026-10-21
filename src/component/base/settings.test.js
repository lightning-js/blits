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
import settings from './settings.js'
import Settings from '../../settings.js'
import engine from '../../engine.js'
import { initLog } from '../../lib/log.js'

initLog()

const $settings = settings.$settings.value

test('$settings - get returns launch settings', (assert) => {
  Settings.set('renderMode', 'webgl')
  assert.equal($settings.get('renderMode'), 'webgl', 'Should return setting value')
  assert.equal($settings.get('unknown', 'x'), 'x', 'Should return default value')
  assert.end()
})

test('$settings - set updates changeable settings', (assert) => {
  $settings.set('w', 1280)
  $settings.set('h', 720)
  $settings.set('screenResolution', 'hd')
  $settings.set('renderQuality', 'retina')
  $settings.set('canvasColor', 'red')
  $settings.set('fpsInterval', 500)
  $settings.set('pixelRatio', 2)
  $settings.set('viewportMargin', [10, 20, 30, 40])
  $settings.set('maxFPS', 30)
  assert.equal(Settings.get('w'), 1280, 'Should update w')
  assert.equal(Settings.get('h'), 720, 'Should update h')
  assert.equal(Settings.get('screenResolution'), 'hd', 'Should update screenResolution')
  assert.equal(Settings.get('renderQuality'), 'retina', 'Should update renderQuality')
  assert.equal(Settings.get('canvasColor'), 'red', 'Should update canvasColor')
  assert.equal(Settings.get('fpsInterval'), 500, 'Should update fpsInterval')
  assert.equal(Settings.get('pixelRatio'), 2, 'Should update pixelRatio')
  assert.deepEqual(Settings.get('viewportMargin'), [10, 20, 30, 40], 'Should update viewportMargin')
  assert.equal(Settings.get('maxFPS'), 30, 'Should update maxFPS')
  assert.end()
})

test('$settings - set accepts Blits runtime settings', (assert) => {
  $settings.set('keymap', { left: 'left' })
  $settings.set('debugLevel', 2)
  $settings.set('inputThrottle', 25)
  $settings.set('announcerOptions', { rate: 1.5 })
  $settings.set('enableMouse', true)
  $settings.set('mouseMoveThrottle', 16)
  assert.deepEqual(Settings.get('keymap'), { left: 'left' }, 'Should update keymap')
  assert.equal(Settings.get('debugLevel'), 2, 'Should update debugLevel')
  assert.equal(Settings.get('inputThrottle'), 25, 'Should update inputThrottle')
  assert.deepEqual(
    Settings.get('announcerOptions'),
    { rate: 1.5 },
    'Should update announcerOptions'
  )
  assert.equal(Settings.get('enableMouse'), true, 'Should update enableMouse')
  assert.equal(Settings.get('mouseMoveThrottle'), 16, 'Should update mouseMoveThrottle')
  assert.end()
})

test('$settings - set ignores launch only settings', (assert) => {
  Settings.set('renderMode', 'webgl')
  $settings.set('renderMode', 'canvas')
  assert.equal(Settings.get('renderMode'), 'webgl', 'Should not update renderMode')
  assert.end()
})

test('$settings - set passes changeable settings to the engine', (assert) => {
  const original = engine.updateSetting
  const calls = []
  engine.updateSetting = (key, value) => calls.push([key, value])

  $settings.set('fpsInterval', 250)
  $settings.set('fonts', [])

  engine.updateSetting = original

  assert.deepEqual(calls, [['fpsInterval', 250]], 'Should only pass changeable settings')
  assert.end()
})
