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

let debounce

const speak = (message, politeness = 'off') => {
  clearTimeout(debounce)
  speechSynthesis.cancel()
  // assertive messages get spoken immediately
  if (politeness === 'assertive') {
    speechSynthesis.speak({ value: message })
  } else {
    debounce = setTimeout(() => {
      speechSynthesis.speak({ value: message })
    }, 400)
  }
}

const polite = (message) => speak(message, 'polite')

const assertive = (message) => speak(message, 'assertive')

const stop = () => {
  speechSynthesis.cancel()
}

export default {
  speak,
  polite,
  assertive,
  stop,
}
