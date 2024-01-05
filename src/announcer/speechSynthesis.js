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

const getUA = () => (window.navigator || {}).userAgent || ''
const isAndroid = () => /android/i.test(getUA())

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

const utterProps = {
  lang: 'en-US',
  pitch: 1,
  rate: 1,
  voice: null,
  volume: 1,
}

const initialize = () => {
  utterProps.voice = syn.getVoices()[0]
  initialized = true
}

const utterance = (scope, e) => {
  const utter = new SpeechSynthesisUtterance(e.value)

  // utter props
  utter.lang = e.lang || utterProps.lang
  utter.pitch = e.pitch || utterProps.pitch
  utter.rate = e.rate || utterProps.rate
  utter.voice = e.voice || utterProps.voice
  utter.volume = e.volume || utterProps.volume

  // utter events
  utter.onstart = () => {
    if (!isAndroid()) {
      resumeInfinity(utter)
    }
    scope.onstart()
  }

  utter.onresume = () => {
    if (!isAndroid()) {
      resumeInfinity(utter)
    }
    scope.onresume()
  }

  utter.onpause = () => {
    scope.onpause()
  }
  utter.onend = () => {
    scope.onend()
  }
  utter.onerror = () => {
    clear()
    scope.onerror()
  }
  syn.speak(utter)
}

export default {
  speak(e) {
    if (!initialized) {
      initialize()
    }
    this.cancel()
    utterance(this, e)
  },
  resume() {
    syn.resume()
  },
  pause() {
    syn.pause()
  },
  cancel() {
    syn.cancel()
    clear()
  },
  getVoices() {
    return syn.getVoices()
  },
  onend() {
    //event placeholder
  },
  onerror() {
    //event placeholder
  },
  onstart() {
    //event placeholder
  },
  onresume() {
    //event placeholder
  },
  onpause() {
    //eventplaceholder
  },
}
