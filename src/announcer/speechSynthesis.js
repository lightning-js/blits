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

const syn = window.speechSynthesis

const isAndroid = () => /android/i.test((window.navigator || {}).userAgent || '')

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

  utterance.lang = options.lang || defaultUtteranceProps.lang
  utterance.pitch = options.pitch || defaultUtteranceProps.pitch
  utterance.rate = options.rate || defaultUtteranceProps.rate
  utterance.voice = options.voice || defaultUtteranceProps.voice
  utterance.volume = options.volume || defaultUtteranceProps.volume

  return new Promise((resolve, reject) => {
    utterance.onend = () => {
      resolve()
    }
    utterance.onerror = (e) => {
      reject(e)
    }

    syn.speak(utterance)
  })
}

// const utterance_old = (scope, e) => {
//   const utter = new SpeechSynthesisUtterance(e.value)

//   // utter props
//   utter.lang = e.lang || utterProps.lang
//   utter.pitch = e.pitch || utterProps.pitch
//   utter.rate = e.rate || utterProps.rate
//   utter.voice = e.voice || utterProps.voice
//   utter.volume = e.volume || utterProps.volume

//   // utter events
//   utter.onstart = () => {
//     if (!isAndroid()) {
//       resumeInfinity(utter)
//     }
//     scope.onstart()
//   }

//   utter.onresume = () => {
//     if (!isAndroid()) {
//       resumeInfinity(utter)
//     }
//     scope.onresume()
//   }

//   utter.onpause = () => {
//     scope.onpause()
//   }
//   utter.onend = () => {
//     scope.onend()
//   }
//   utter.onerror = () => {
//     clear()
//     scope.onerror()
//   }
//   syn.speak(utter)
// }

export default {
  speak(options) {
    if (!initialized) {
      initialize()
    }
    // this.cancel()
    return speak(options)
  },
  // resume() {
  //   syn.resume()
  // },
  // pause() {
  //   syn.pause()
  // },
  cancel() {
    syn.cancel()
    clear()
  },
  // getVoices() {
  //   return syn.getVoices()
  // },
}
