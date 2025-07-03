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

const utterances = []

let initialized = false
let infinityTimer = null
const clear = () => infinityTimer && clearTimeout(infinityTimer)

const resumeInfinity = (target) => {
  if (!target || infinityTimer) {
    return clear()
  }

  syn.pause()
  syn.resume()

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
  defaultUtteranceProps.voice = syn.getVoices()[0]
  initialized = true
}

const speak = (options) => {
  const utterance = new SpeechSynthesisUtterance(options.message)

  // push utterance into an array to prevent premature GC on certain devices
  // causing the `onend`-event to not fire
  utterances.push(utterance)

  utterance.lang = options.lang || defaultUtteranceProps.lang
  utterance.pitch = options.pitch || defaultUtteranceProps.pitch
  utterance.rate = options.rate || defaultUtteranceProps.rate
  utterance.voice = options.voice || defaultUtteranceProps.voice
  utterance.volume = options.volume || defaultUtteranceProps.volume

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
      resolve()
    }
    utterance.onerror = (e) => {
      reject(e)
    }

    syn.speak(utterance)
  }).finally(() => {
    // clean up utterance to prevent dangling utterances in memory
    const index = utterances.indexOf(utterance)
    if (index !== -1) {
      utterances.splice(index)
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
      syn.cancel()
      clear()
    }
  },
  // @todo
  // getVoices() {
  //   return syn.getVoices()
  // },
}
