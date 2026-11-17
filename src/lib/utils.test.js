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
import { toNumber, isObjectString, isArrayString } from './utils.js'

test('utils - toNumber coerces numeric strings (template statics)', (assert) => {
  assert.equal(toNumber(10), 10, 'number passes through')
  assert.equal(toNumber('10'), 10, 'numeric string coerces')
  assert.equal(toNumber('-10'), -10, 'negative string coerces (y="-10" case)')
  assert.equal(toNumber('2.5'), 2.5, 'float string coerces')
  assert.equal(toNumber(' 42 '), 42, 'whitespace trimmed by Number()')
  assert.equal(toNumber('50%'), '50%', 'percentage strings untouched')
  assert.deepEqual(toNumber([1]), [1], 'arrays untouched')
  assert.equal(toNumber(''), '', 'empty string untouched')
  assert.equal(toNumber('auto'), 'auto', 'keywords untouched')
  assert.equal(toNumber(undefined), undefined, 'undefined untouched')
  assert.equal(toNumber(null), null, 'null untouched')
  assert.end()
})

test('utils - string guards stay intact', (assert) => {
  assert.equal(isObjectString('{a: 1}'), true, 'object string')
  assert.equal(isObjectString('10'), false, 'plain number string is not an object')
  assert.equal(isArrayString('[1, 2]'), true, 'array string')
  assert.end()
})
