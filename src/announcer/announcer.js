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
import { Log } from '../lib/log.js'

let debounce
let settings = {
  enabled: false,
}

const clearDebounce = () => {
  if (debounce) {
    clearTimeout(debounce)
  }
}

const initialize = (initSettings) => {
  settings = {
    enabled: initSettings.enabled || false,
  }
  speechSynthesis.initialize(initSettings)
}

const speak = (message, politeness = 'off') => {
  stop()
  // stop announcer from speaking if not enabled
  if (!settings.enabled) return
  // assertive messages get spoken immediately
  if (politeness === 'assertive') {
    executeSpeak(message)
  } else {
    debounce = setTimeout(() => {
      executeSpeak(message)
    }, 400)
  }
}

const executeSpeak = (message) => {
  Log.debug(`Announcer: ${message}`)
  speechSynthesis.speak({ value: message })
}

const polite = (message) => speak(message, 'polite')

const assertive = (message) => speak(message, 'assertive')

const stop = () => {
  clearDebounce()
  speechSynthesis.cancel()
}

const destroy = () => {
  stop()
  //will need destroy function later when we can watch app settings
}

export default {
  speak,
  polite,
  assertive,
  stop,
  initialize,
  destroy,
}
