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
 *
 */

import test from 'tape'
import Application from './application.js'
import { initLog } from './lib/log.js'
import Focus, { keyUpCallbacks } from './focus/focus.js'
import symbols from './lib/symbols.js'

initLog()

test('Key-up clears hold even when the release callback throws', (assert) => {
  const config = {}
  const app = {
    $componentId: 'App',
    [symbols.lifecycle]: { state: 'init' },
    $announcer: { toggle: () => {}, configure: () => {} },
  }
  const originalAddEventListener = document.addEventListener
  let keyUpHandler
  document.addEventListener = function (type, handler, ...options) {
    if (type === 'keyup') keyUpHandler = handler
    return originalAddEventListener.call(this, type, handler, ...options)
  }

  const error = new Error('Release callback failed')
  try {
    Application(config)
    config.hooks[symbols.init].call(app)
    Focus.hold = true
    keyUpCallbacks.set(13, {
      component: { eol: false },
      callback: () => {
        throw error
      },
    })

    assert.throws(
      () => keyUpHandler({ keyCode: 13 }),
      (caught) => caught === error,
      'the callback error still propagates'
    )
    assert.equal(Focus.hold, false, 'hold is cleared despite the callback error')
  } finally {
    keyUpCallbacks.delete(13)
    config.hooks[symbols.destroy].call(app)
    document.addEventListener = originalAddEventListener
  }
  assert.end()
})
