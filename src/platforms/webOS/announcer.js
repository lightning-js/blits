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

const globalScope = globalThis
const defaultUri = 'luna://com.webos.service.tts'

const getDefaultRequest = () => {
  const windowRef = globalScope.window
  const webOS = globalScope.webOS || (windowRef && windowRef.webOS)

  if (webOS && webOS.service && typeof webOS.service.request === 'function') {
    return webOS.service.request.bind(webOS.service)
  }
}

const createAnnouncer = (options = {}) => {
  const request = options.request || getDefaultRequest()
  const uri = options.uri || defaultUri
  const clear = options.clear !== false

  let currentRequest

  return {
    speak(announcement) {
      if (request === undefined) {
        return Promise.reject({ error: 'unavailable' })
      }

      if (!announcement || announcement.message === undefined || announcement.message === null) {
        return Promise.reject({ error: 'Missing message' })
      }

      try {
        currentRequest = request(uri, {
          method: 'speak',
          parameters: {
            text: String(announcement.message),
            clear,
          },
          onFailure(error) {
            currentRequest = undefined
            if (options.onFailure) {
              options.onFailure(error)
            }
          },
        })
      } catch (error) {
        currentRequest = undefined
        return Promise.reject(error)
      }

      return Promise.resolve()
    },
    cancel() {
      if (currentRequest && typeof currentRequest.cancel === 'function') {
        currentRequest.cancel()
      }
      currentRequest = undefined
    },
  }
}

export default createAnnouncer
