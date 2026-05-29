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
import { configurePlatform, platform as activePlatform } from './platform.js'

test('Platform - configurePlatform merges custom references with browser defaults', (assert) => {
  const customDocument = {}
  const platform = configurePlatform({
    document: customDocument,
    customCapability: true,
  })

  assert.equal(platform.document, customDocument, 'custom document reference is used')
  assert.equal(platform.window, window, 'browser default window is preserved')
  assert.equal(platform.customCapability, true, 'custom platform fields are preserved')
  assert.equal(activePlatform, platform, 'configured platform becomes the active platform')

  configurePlatform()
  assert.end()
})
test('Platform - configurePlatform accepts a callback with browser defaults', (assert) => {
  const platform = configurePlatform((defaults) => ({
    window: defaults.window,
    callbackPlatform: true,
  }))

  assert.equal(platform.window, window, 'callback receives browser defaults')
  assert.equal(platform.callbackPlatform, true, 'callback result is merged into platform')

  configurePlatform()
  assert.end()
})
