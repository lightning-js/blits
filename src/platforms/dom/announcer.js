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
const defaultId = 'blits-announcer'

const visuallyHiddenStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
}

const createAnnouncer = (options = {}) => {
  const documentRef = Object.prototype.hasOwnProperty.call(options, 'document')
    ? options.document
    : globalScope.document
  const id = options.id || defaultId
  const updateDelay = options.updateDelay === undefined ? 0 : options.updateDelay

  let region
  let pendingUpdate

  const getRegion = () => {
    if (!documentRef || typeof documentRef.createElement !== 'function') return
    if (region && region.isConnected !== false) return region

    region = typeof documentRef.getElementById === 'function' && documentRef.getElementById(id)

    if (!region) {
      const parent = options.container || documentRef.body || documentRef.documentElement
      if (!parent || typeof parent.appendChild !== 'function') return

      region = documentRef.createElement('div')
      region.id = id
      parent.appendChild(region)
    }

    Object.assign(region.style, visuallyHiddenStyles)
    region.setAttribute('role', 'alert')
    region.setAttribute('aria-live', 'assertive')
    region.setAttribute('aria-atomic', 'true')

    return region
  }

  const cancelPendingUpdate = (error = 'canceled') => {
    if (pendingUpdate === undefined) return
    clearTimeout(pendingUpdate.timer)
    pendingUpdate.reject({ error })
    pendingUpdate = undefined
  }

  // Create the empty region before the first announcement so assistive
  // technology can observe subsequent content changes reliably.
  getRegion()

  return {
    speak(announcement) {
      if (!announcement || announcement.message === undefined || announcement.message === null) {
        return Promise.reject({ error: 'Missing message' })
      }

      const liveRegion = getRegion()
      if (!liveRegion) {
        return Promise.reject({ error: 'unavailable' })
      }

      cancelPendingUpdate()
      liveRegion.textContent = ''

      return new Promise((resolve, reject) => {
        const update = {
          reject,
          timer: setTimeout(() => {
            if (pendingUpdate !== update) return
            liveRegion.textContent = String(announcement.message)
            pendingUpdate = undefined
            resolve()
          }, updateDelay),
        }
        pendingUpdate = update
      })
    },
    cancel() {
      cancelPendingUpdate()
      if (region) region.textContent = ''
    },
  }
}

export default createAnnouncer
