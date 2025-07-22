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

const utterances = new Map() // Strong references with unique keys

let initialized = false
let infinityTimer = null

const clear = () => {
  if (infinityTimer) {
    clearTimeout(infinityTimer)
    infinityTimer = null
  }
}

const resumeInfinity = (target) => {
  if (!target || infinityTimer) {
    return clear()
  }

  syn.pause()
  setTimeout(() => {
    syn.resume()
  }, 0)

  infinityTimer = setTimeout(() => {
    resumeInfinity(target)
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
  const voices = syn.getVoices()
  defaultUtteranceProps.voice = voices[0] || null
  initialized = true
}

const speak = (options) => {
  const utterance = new SpeechSynthesisUtterance(options.message)
  const id = Date.now() + Math.random() // Unique ID for tracking
  utterance.lang = options.lang || defaultUtteranceProps.lang
  utterance.pitch = options.pitch || defaultUtteranceProps.pitch
  utterance.rate = options.rate || defaultUtteranceProps.rate
  utterance.voice = options.voice || defaultUtteranceProps.voice
  utterance.volume = options.volume || defaultUtteranceProps.volume
  utterances.set(id, utterance) // Strong reference

  if (isAndroid === false) {
    utterance.onstart = () => {
      resumeInfinity(utterance)
    }

    utterance.onresume = () => {
      resumeInfinity(utterance)
    }
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => {
      clear()
      utterances.delete(id) // Cleanup
      resolve()
    }

    utterance.onerror = (e) => {
      clear()
      utterances.delete(id) // Cleanup
      reject(e)
    }

    syn.speak(utterance)
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
      syn.cancel()
      clear()
    }
  },
  // @todo
  // getVoices() {
  //   return syn.getVoices()
  // },
}
