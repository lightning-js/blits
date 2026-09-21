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
import symbols from '../lib/symbols.js'
import { isInAliveComponentTree } from './helpers.js'

test('Cached focus must have a live chain to the restored view', (assert) => {
  const restoredView = {}
  const liveParent = { [symbols.parent]: restoredView }
  const liveFocus = { [symbols.parent]: liveParent }
  const destroyedParent = { eol: true, [symbols.parent]: restoredView }
  const staleFocus = { [symbols.parent]: destroyedParent }
  const detachedFocus = {}

  assert.equal(
    isInAliveComponentTree(liveFocus, restoredView),
    true,
    'Live descendant should be valid cached focus'
  )
  assert.equal(
    isInAliveComponentTree(staleFocus, restoredView),
    false,
    'Focus with a destroyed ancestor should be rejected'
  )
  assert.equal(
    isInAliveComponentTree(detachedFocus, restoredView),
    false,
    'Focus detached from restored view should be rejected'
  )
  assert.end()
})
