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

import speechSynthesis from './speechSynthesis.js'

let active = false
let count = 0
const queue = []
let isProcessing = false
let currentId = null
let debounce = null

const noopAnnouncement = {
  then() {},
  done() {},
  cancel() {},
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

const speak = (message, politeness = 'off') => {
  if (active === false) return noopAnnouncement

  return addToQueue(message, politeness)
}

const pause = (delay) => {
  if (active === false) return noopAnnouncement

  return addToQueue(undefined, undefined, delay)
}

const addToQueue = (message, politeness, delay = false) => {
  // keep track of the id so message can be canceled
  const id = count++

  // setup a promise to allow developer to chain functionality
  // when specific utterances are done
  let resolveFn
  const done = new Promise((resolve) => {
    resolveFn = resolve
  })

  // augment the promise with a cancel function
  done.cancel = () => {
    const index = queue.findIndex((item) => item.id === id)
    if (index !== -1) queue.splice(index, 1)
    isProcessing = false
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
      ? queue.unshift({ message, resolveFn, id })
      : queue.push({ message, resolveFn, id })
  } else {
    queue.push({ delay, resolveFn, id })
  }

  setTimeout(() => {
    processQueue()
  }, 100)

  return done
}

const processQueue = async () => {
  if (isProcessing === true || queue.length === 0) return
  isProcessing = true

  const { message, resolveFn, delay, id } = queue.shift()

  currentId = id

  if (delay) {
    setTimeout(() => {
      isProcessing = false
      currentId = null
      resolveFn('finished')
      processQueue()
    }, delay)
  } else {
    if (debounce !== null) clearTimeout(debounce)
    // add some easing when speaking the messages to reduce stuttering
    debounce = setTimeout(() => {
      speechSynthesis
        .speak({ message })
        .then(() => {
          isProcessing = false
          currentId = null
          resolveFn('finished')
          processQueue()
        })
        .catch((e) => {
          isProcessing = false
          currentId = null
          resolveFn(e.error)
          processQueue()
        })
      debounce = null
    }, 200)
  }
}

const polite = (message) => speak(message, 'polite')

const assertive = (message) => speak(message, 'assertive')

const stop = () => {
  speechSynthesis.cancel()
}

const clear = () => {
  isProcessing = false
  queue.length = 0
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
}
