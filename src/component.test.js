/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import test from 'tape'
import Component from './component.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof Component

  assert.equal(actual, expected, 'Component should be a function')
  assert.end()
})

test('Component - Factory function', (assert) => {
  const expected = 'function'
  const actual = typeof Component('my component', {})

  assert.equal(actual, expected, 'Component should be a factory function (i.e. return a function)')
  assert.end()
})

test('Component - Factory requires a name to be passed', (assert) => {
  assert.throws(() => {
    Component()
  }, 'Thorw an error when no name argument has been passed')

  assert.end()
})

test('Component - Factory requires a name to be passed', (assert) => {
  assert.throws(() => {
    Component()
  }, 'Throw an error when no name argument has been passed')

  assert.end()
})
