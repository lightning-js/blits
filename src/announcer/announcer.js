/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import { Log } from '../lib/log.js'
import speechSynthesis from './speechSynthesis.js'

let active = false
let count = 0
const queue = []
let isProcessing = false
let currentId = null
let debounce = null

// Global default utterance options
let globalDefaultOptions = {}

const noopAnnouncement = {
  then() {},
  done() {},
  cancel() {},
  remove() {},
  stop() {},
}

const enable = () => {
  active = true
}

const disable = () => {
  active = false
}

const toggle = (v) => {
  active = v ? true : false
}

const speak = (message, politeness = 'off', options = {}) => {
  if (active === false) return noopAnnouncement

  // if cancelPrevious option is set, clear the queue and stop current speech
  if (options.cancelPrevious === true) {
    clear()
  }

  return addToQueue(message, politeness, false, options)
}

const pause = (delay) => {
  if (active === false) return noopAnnouncement

  return addToQueue(undefined, undefined, delay)
}

const addToQueue = (message, politeness, delay = false, options = {}) => {
  // keep track of the id so message can be canceled
  const id = count++

  // setup a promise to allow developer to chain functionality
  // when specific utterances are done
  let resolveFn
  const done = new Promise((resolve) => {
    resolveFn = resolve
  })

  // augment the promise with a cancel / remove function
  done.remove = done.cancel = () => {
    const index = queue.findIndex((item) => item.id === id)
    if (index !== -1) queue.splice(index, 1)
    Log.debug(`Announcer - removed from queue: "${message}" (id: ${id})`)
    resolveFn('canceled')
  }

  // augment the promise with a stop function
  done.stop = () => {
    if (id === currentId) {
      speechSynthesis.cancel()
      isProcessing = false
      resolveFn('interupted')
    }
  }

  // add message of pause
  if (delay === false) {
    politeness === 'assertive'
      ? queue.unshift({ message, resolveFn, id, options })
      : queue.push({ message, resolveFn, id, options })
  } else {
    queue.push({ delay, resolveFn, id })
  }

  Log.debug(`Announcer - added to queue: "${message}" (id: ${id})`)

  setTimeout(() => {
    processQueue()
  }, 100)

  return done
}

let currentResolveFn = null

const processQueue = async () => {
  if (isProcessing === true || queue.length === 0) return
  isProcessing = true

  const { message, resolveFn, delay, id, options = {} } = queue.shift()

  currentId = id
  currentResolveFn = resolveFn

  if (delay) {
    setTimeout(() => {
      isProcessing = false
      currentId = null
      currentResolveFn = null
      resolveFn('finished')
      processQueue()
    }, delay)
  } else {
    if (debounce !== null) clearTimeout(debounce)
    // add some easing when speaking the messages to reduce stuttering
    debounce = setTimeout(() => {
      Log.debug(`Announcer - speaking: "${message}" (id: ${id})`)

      speechSynthesis
        .speak({
          message,
          id,
          ...globalDefaultOptions,
          ...options,
        })
        .then(() => {
          Log.debug(`Announcer - finished speaking: "${message}" (id: ${id})`)

          currentId = null
          currentResolveFn = null
          isProcessing = false
          resolveFn('finished')
          processQueue()
        })
        .catch((e) => {
          currentId = null
          currentResolveFn = null
          isProcessing = false
          Log.debug(`Announcer - error ("${e.error}") while speaking: "${message}" (id: ${id})`)
          resolveFn(e.error)
          processQueue()
        })
      debounce = null
    }, 300)
  }
}

const polite = (message, options = {}) => speak(message, 'polite', options)

const assertive = (message, options = {}) => speak(message, 'assertive', options)

// Clear debounce timer
const clearDebounceTimer = () => {
  if (debounce !== null) {
    clearTimeout(debounce)
    debounce = null
  }
}

const stop = () => {
  Log.debug('Announcer - stop() called')

  // Clear debounce timer if speech hasn't started yet
  clearDebounceTimer()

  // Always cancel speech synthesis to ensure clean state
  speechSynthesis.cancel()

  // Store resolve function before resetting state
  const prevResolveFn = currentResolveFn

  // Reset state
  currentId = null
  currentResolveFn = null
  isProcessing = false

  // Resolve promise if there was an active utterance
  if (prevResolveFn) {
    prevResolveFn('interrupted')
  }
}

const clear = () => {
  Log.debug('Announcer - clear() called')

  // Clear debounce timer
  clearDebounceTimer()

  // Cancel any active speech synthesis
  speechSynthesis.cancel()

  // Resolve all pending items in queue
  while (queue.length > 0) {
    const item = queue.shift()
    if (item.resolveFn) {
      Log.debug(`Announcer - clearing queued item: "${item.message}" (id: ${item.id})`)
      item.resolveFn('cleared')
    }
  }

  // Reset state
  currentId = null
  currentResolveFn = null
  isProcessing = false
}

const configure = (options = {}) => {
  globalDefaultOptions = { ...globalDefaultOptions, ...options }
}

export default {
  speak,
  polite,
  assertive,
  stop,
  enable,
  disable,
  toggle,
  clear,
  pause,
  configure,
}
