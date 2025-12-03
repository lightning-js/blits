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

const syn = window.speechSynthesis

const isAndroid = /android/i.test((window.navigator || {}).userAgent || '')

const utterances = new Map() // id -> { utterance, timer, ignoreResume }

let initialized = false

const clear = (id) => {
  const state = utterances.get(id)
  if (state?.timer !== null) {
    clearTimeout(state.timer)
    state.timer = null
  }
}

const resumeInfinity = (id) => {
  const state = utterances.get(id)

  // utterance status: utterance was removed (cancelled or finished)
  if (!state) {
    return
  }

  const { utterance } = state

  // utterance check: utterance instance is invalid
  if (!(utterance instanceof SpeechSynthesisUtterance)) {
    clear(id)
    utterances.delete(id)
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
    utterances.delete(id)
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

  state.timer = setTimeout(() => {
    resumeInfinity(id)
  }, 5000)
}

const defaultUtteranceProps = {
  lang: 'en-US',
  pitch: 1,
  rate: 1,
  voice: null,
  volume: 1,
}

const initialize = () => {
  // syn api check: syn might not have getVoices method
  if (!syn || typeof syn.getVoices !== 'function') {
    initialized = true
    return
  }

  const voices = syn.getVoices()
  defaultUtteranceProps.voice = voices[0] || null
  initialized = true
}

const speak = (options) => {
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
    utterances.delete(id)
  }

  const utterance = new SpeechSynthesisUtterance(options.message)
  utterance.lang = options.lang || defaultUtteranceProps.lang
  utterance.pitch = options.pitch || defaultUtteranceProps.pitch
  utterance.rate = options.rate || defaultUtteranceProps.rate
  utterance.voice = options.voice || defaultUtteranceProps.voice
  utterance.volume = options.volume || defaultUtteranceProps.volume

  utterances.set(id, { utterance, timer: null, ignoreResume: false })

  if (isAndroid === false) {
    utterance.onstart = () => {
      // utterances status: check if utterance still exists
      if (utterances.has(id)) {
        resumeInfinity(id)
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

      resumeInfinity(id)
    }

    // pause events: handle pause events
    utterance.onpause = () => {
      // Stop keep-alive when manually paused
      clear(id)
    }
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => {
      clear(id)
      utterances.delete(id)
      resolve()
    }

    utterance.onerror = (e) => {
      Log.warn('SpeechSynthesisUtterance error:', e)
      clear(id)
      utterances.delete(id)
      resolve()
    }

    // handle error: syn.speak might throw
    try {
      syn.speak(utterance)
    } catch (error) {
      clear(id)
      utterances.delete(id)
      reject(error)
    }
  })
}

export default {
  speak(options) {
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
