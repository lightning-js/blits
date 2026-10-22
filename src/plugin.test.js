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

import test from 'tape'
import registerPlugin, { plugins } from './plugin.js'

test('Function plugin registration', (assert) => {
  const mockPlugin = () => ({ test: 'value' })
  const options = { config: 'test' }

  //  test function type check, valid registration, default options, custom options
  registerPlugin(mockPlugin, 'testPlugin')
  assert.ok(
    plugins.testPlugin?.plugin === mockPlugin &&
      plugins.testPlugin?.options &&
      typeof registerPlugin === 'function',
    'Function plugin registered correctly with default options'
  )

  registerPlugin(mockPlugin, 'testPluginWithOptions', options)
  assert.deepEqual(
    plugins.testPluginWithOptions.options,
    options,
    'Function plugin registered with custom options'
  )

  assert.end()
})

test('Function plugin errors', (assert) => {
  const mockPlugin = () => ({ test: 'value' })

  //  test both undefined name and empty string name error cases
  assert.throws(
    () => registerPlugin(mockPlugin),
    /Error registering plugin: name is required for plugin/,
    'Function plugin without name throws error'
  )
  assert.throws(
    () => registerPlugin(mockPlugin, { config: 'test' }),
    /Error registering plugin: name is required for plugin/,
    'Function plugin with options as name throws error'
  )

  assert.end()
})

test('Object plugin registration', (assert) => {
  const mockPlugin = () => ({ test: 'value' })
  const options = { setting: 'value' }

  //  test object plugin detection, recursive registration, name resolution, options handling
  registerPlugin({ plugin: mockPlugin, name: 'objectPlugin' })
  registerPlugin({ plugin: mockPlugin, name: 'originalName' }, 'customName')
  registerPlugin({ plugin: mockPlugin, name: 'pluginWithOptions' }, options)

  assert.ok(
    plugins.objectPlugin?.plugin === mockPlugin &&
      plugins.customName?.plugin === mockPlugin &&
      !plugins.originalName &&
      plugins.pluginWithOptions?.options === options &&
      plugins.log,
    'Object plugins registered correctly with name resolution, options, and default log plugin exists'
  )

  assert.end()
})
