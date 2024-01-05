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

const entryPoliteness = {
  assertive: 0,
  off: 1,
  polite: 2,
}

let entries = []
let currentEntry = null

const clearEntries = () => {
  entries.length = 0
}

const playFirstEntry = () => {
  currentEntry = entries.shift()
  speechSynthesis.speak({ value: currentEntry.message })

  speechSynthesis.onend = () => {
    if (entries.length > 0) {
      playFirstEntry()
    }
  }
  speechSynthesis.onerror = speechSynthesis.onend
}

const speak = (message, politeness = 'off') => {
  if (currentEntry && politeness === 'assertive' && currentEntry.politeness !== 'assertive') {
    speechSynthesis.cancel()
    entries.shift()
  }
  entries.push({ message, politeness })
  entries = entries.sort((a, b) => entryPoliteness[a.politeness] - entryPoliteness[b.politeness])
  if (politeness === 'assertive') {
    entries = entries.filter((a) => entryPoliteness[a.politeness] < 2)
  }
  if (!speechSynthesis.hasEntry()) {
    playFirstEntry()
  }
}

const polite = (message) => speak(message, 'polite')

const assertive = (message) => speak(message, 'assertive')

const stop = () => {
  speechSynthesis.cancel()
}

const clear = () => {
  clearEntries()
}

export default {
  speak,
  polite,
  assertive,
  stop,
  clear,
}
