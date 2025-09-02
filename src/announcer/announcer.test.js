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
import announcer from './announcer.js'
import { initLog } from 'src/lib/log.js'

initLog()
announcer.enable()

test('Announcer 1 Second Pause', (assert) => {
  assert.comment('start 1 second pause')
  announcer.pause(1000).then((response) => {
    assert.equal(response, 'finished', 'pause finished')
    assert.end()
  })
})

test('Announcer 1 Second Pause Remove', (assert) => {
  assert.comment('start 1 second pause')
  const pause = announcer.pause(1000)
  pause.then((response) => {
    assert.equal(response, 'canceled', 'removed pause')
    assert.end()
  })
  assert.comment('remove pause')
  pause.remove()
})
