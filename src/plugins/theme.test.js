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
import themePlugin from './theme.js'

test('Empty Theme creation', (assert) => {
  const theme = themePlugin.plugin()

  assert.equal(theme.get('someColor'), undefined, 'someColor should be undefined')
  assert.end()
})

test('Basic theme creation & usage', (assert) => {
  const theme = themePlugin.plugin({
    someColor: 'pink',
    someSizes: {
      tile: 200,
    },
  })

  assert.equal(theme.get('someColor'), 'pink', 'someColor should be pink')
  assert.equal(theme.get('someSizes.tile'), 200, 'someSizes.tile should be 200')
  assert.end()
})

test('Advanced theme creation & usage', (assert) => {
  const theme = themePlugin.plugin({
    themes: {
      base: {
        someColor: 'pink',
        someSizes: {
          tile: 200,
        },
      },
      carrot: {
        someColor: 'orange',
      },
      apple: {
        someSizes: {
          tile: 50,
        },
      },
    },
    base: 'base',
    current: 'carrot',
  })

  assert.equal(theme.get('someColor'), 'orange', 'someColor should be orange')
  assert.equal(theme.get('someSizes.tile'), 200, 'someSizes.tile should be 200')

  theme.set('apple')
  assert.equal(theme.get('someColor'), 'pink', 'someColor should be pink')
  assert.equal(theme.get('someSizes.tile'), 50, 'someSizes.tile should be 50')
  assert.end()
})
