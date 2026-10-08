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
import createAnnouncer from './announcer.js'

test('webOS announcer speaks through webOS TTS service', (assert) => {
  const calls = []
  const announcer = createAnnouncer({
    request(uri, options) {
      calls.push({ uri, options })
      return {}
    },
  })

  announcer
    .speak({ id: 1, message: 'Hello webOS' })
    .then(() => {
      assert.equal(calls.length, 1, 'one webOS service request is made')
      assert.equal(calls[0].uri, 'luna://com.webos.service.tts', 'default TTS service is used')
      assert.equal(calls[0].options.method, 'speak', 'speak method is used')
      assert.deepEqual(
        calls[0].options.parameters,
        { text: 'Hello webOS', clear: true },
        'message text and clear flag are passed'
      )
      assert.end()
    })
    .catch((e) => {
      assert.fail('Should not reject: ' + JSON.stringify(e))
      assert.end()
    })
})

test('webOS announcer supports custom URI and clear option', (assert) => {
  const calls = []
  const announcer = createAnnouncer({
    uri: 'luna://custom.tts',
    clear: false,
    request(uri, options) {
      calls.push({ uri, options })
      return {}
    },
  })

  announcer
    .speak({ id: 2, message: 'Custom' })
    .then(() => {
      assert.equal(calls[0].uri, 'luna://custom.tts', 'custom URI is used')
      assert.deepEqual(
        calls[0].options.parameters,
        { text: 'Custom', clear: false },
        'custom clear option is used'
      )
      assert.end()
    })
    .catch((e) => {
      assert.fail('Should not reject: ' + JSON.stringify(e))
      assert.end()
    })
})

test('webOS announcer calls onFailure hook', (assert) => {
  const expectedError = { errorText: 'TTS failed' }
  const announcer = createAnnouncer({
    request(uri, options) {
      options.onFailure(expectedError)
      return {}
    },
    onFailure(error) {
      assert.equal(error, expectedError, 'failure error is forwarded')
      assert.end()
    },
  })

  announcer.speak({ id: 3, message: 'Failure' }).catch((e) => {
    assert.fail('Should not reject from async onFailure: ' + JSON.stringify(e))
    assert.end()
  })
})

test('webOS announcer cancels active request handle', (assert) => {
  const handle = {
    canceled: false,
    cancel() {
      this.canceled = true
    },
  }
  const announcer = createAnnouncer({
    request() {
      return handle
    },
  })

  announcer.speak({ id: 4, message: 'Cancel me' }).then(() => {
    announcer.cancel()
    assert.equal(handle.canceled, true, 'active request is canceled')
    assert.end()
  })
})

test('webOS announcer rejects as unavailable without webOS request', (assert) => {
  const announcer = createAnnouncer()

  announcer
    .speak({ id: 5, message: 'Unavailable' })
    .then(() => {
      assert.fail('Should reject when webOS request is missing')
      assert.end()
    })
    .catch((e) => {
      assert.equal(e.error, 'unavailable', 'unavailable error is returned')
      assert.end()
    })
})
