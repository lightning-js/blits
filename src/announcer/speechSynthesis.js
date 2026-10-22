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

const utterances = new Map() // id -> { utterance, timer, ignoreResume }

let initialized = false
const globalScope = globalThis

const getSpeechSynthesis = () => {
  const windowRef = globalScope.window
  const selfRef = globalScope.self || windowRef || globalScope

  return (
    globalScope.speechSynthesis ||
    (selfRef && selfRef.speechSynthesis) ||
    (windowRef && windowRef.speechSynthesis)
  )
}

const getSpeechSynthesisUtterance = () => {
  const windowRef = globalScope.window

  return globalScope.SpeechSynthesisUtterance || (windowRef && windowRef.SpeechSynthesisUtterance)
}

const clear = (id) => {
  const state = utterances.get(id)
  if (state === undefined) {
    return
  }
  if (state.timer !== null) {
    clearTimeout(state.timer)
    state.timer = null
  }
  utterances.delete(id)
}

const startKeepAlive = (id) => {
  const syn = getSpeechSynthesis()
  const state = utterances.get(id)

  // utterance status: utterance was removed (cancelled or finished)
  if (state == undefined) {
    return
  }

  // Clear existing timer for this specific utterance
  if (state.timer !== null) {
    clearTimeout(state.timer)
    state.timer = null
  }

  // syn status: syn might be undefined or cancelled
  if (!syn) {
    clear(id)
    return
  }

  syn.pause()
  setTimeout(() => {
    // utterance status: utterance might have been removed during setTimeout
    const currentState = utterances.get(id)
    if (currentState) {
      currentState.ignoreResume = true
      syn.resume()
    }
  }, 0)

  // Check if utterance still exists before scheduling next cycle
  if (utterances.has(id) === true) {
    state.timer = setTimeout(() => {
      // Double-check utterance still exists before resuming
      if (utterances.has(id) === true) {
        startKeepAlive(id)
      }
    }, 5000)
  }
}

const defaultUtteranceProps = {
  lang: 'en-US',
  pitch: 1,
  rate: 1,
  voice: null,
  volume: 1,
}

const initialize = () => {
  const syn = getSpeechSynthesis()
  // syn api check: syn might not have getVoices method
  if (!syn || typeof syn.getVoices !== 'function') {
    initialized = false
    return
  }

  const voices = syn.getVoices()
  defaultUtteranceProps.voice = voices[0] || null
  initialized = true
}

const waitForSynthReady = (timeoutMs = 2000, checkIntervalMs = 100) => {
  return new Promise((resolve) => {
    const syn = getSpeechSynthesis()
    if (!syn) {
      Log.debug('SpeechSynthesis - syn unavailable')
      resolve()
      return
    }

    if (!syn.speaking && !syn.pending) {
      Log.debug('SpeechSynthesis - ready immediately')
      resolve()
      return
    }

    Log.debug('SpeechSynthesis - waiting for ready state...')

    const startTime = Date.now()

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime
      const isReady = !syn.speaking && !syn.pending

      if (isReady) {
        Log.debug(`SpeechSynthesis - ready after ${elapsed}ms`)
        clearInterval(intervalId)
        resolve()
      } else if (elapsed >= timeoutMs) {
        Log.debug(`SpeechSynthesis - timeout after ${elapsed}ms, forcing ready`, {
          speaking: syn.speaking,
          pending: syn.pending,
        })
        clearInterval(intervalId)
        resolve()
      }
    }, checkIntervalMs)
  })
}

const speak = async (options) => {
  const syn = getSpeechSynthesis()
  // options check: missing required options
  if (!options || !options.message) {
    return Promise.reject({ error: 'Missing message' })
  }

  // options check: missing or invalid id
  const id = options.id
  if (id === undefined || id === null) {
    return Promise.reject({ error: 'Missing id' })
  }

  // utterance status: utterance with same id already exists
  if (utterances.has(id)) {
    clear(id)
  }

  // Wait for engine to be ready
  await waitForSynthReady()

  const SpeechSynthesisUtterance = getSpeechSynthesisUtterance()
  if (SpeechSynthesisUtterance === undefined) {
    return Promise.reject({ error: 'unavailable' })
  }

  const utterance = new SpeechSynthesisUtterance(options.message)
  utterance.lang = options.lang || defaultUtteranceProps.lang
  utterance.pitch = options.pitch || defaultUtteranceProps.pitch
  utterance.rate = options.rate || defaultUtteranceProps.rate
  utterance.voice = options.voice || defaultUtteranceProps.voice
  utterance.volume = options.volume || defaultUtteranceProps.volume

  utterances.set(id, { utterance, timer: null, ignoreResume: false })

  return new Promise((resolve, reject) => {
    utterance.onend = (result) => {
      clear(id)
      resolve(result)
    }

    utterance.onerror = (e) => {
      Log.warn('SpeechSynthesisUtterance error:', e)
      clear(id)
      resolve()
    }

    if (options.enableUtteranceKeepAlive === true) {
      utterance.onstart = () => {
        // utterances status: check if utterance still exists
        if (utterances.has(id)) {
          startKeepAlive(id)
        }
      }

      utterance.onresume = () => {
        const state = utterances.get(id)
        // utterance status: utterance might have been removed
        if (!state) return

        if (state.ignoreResume === true) {
          state.ignoreResume = false
          return
        }

        startKeepAlive(id)
      }
    }
    // handle error: syn.speak might throw
    try {
      syn.speak(utterance)
    } catch (error) {
      clear(id)
      reject(error)
    }
  })
}

export default {
  speak(options) {
    const syn = getSpeechSynthesis()
    if (syn !== undefined) {
      if (initialized === false) {
        initialize()
      }
      return speak(options)
    } else {
      Log.error('speechSynthesis web API not available')
      return Promise.reject({ error: 'unavailable' })
    }
  },
  cancel() {
    const syn = getSpeechSynthesis()
    if (syn !== undefined) {
      // timers: clear all timers before cancelling
      for (const id of utterances.keys()) {
        clear(id)
      }

      // handle errors: syn.cancel might throw
      try {
        syn.cancel()
      } catch (error) {
        Log.error('Error cancelling speech synthesis:', error)
      }

      // utterances status: ensure all utterances are cleaned up
      utterances.clear()
    }
  },
  // @todo
  // getVoices() {
  //   return syn.getVoices()
  // },
}
