/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

const globalScope = globalThis

const getGlobal = (key) => (key in globalScope ? globalScope[key] : undefined)

const browserPlatform = () => {
  const windowRef = getGlobal('window')
  const documentRef = getGlobal('document') || windowRef?.document
  const selfRef = getGlobal('self') || windowRef || globalScope
  const navigatorRef = getGlobal('navigator') || windowRef?.navigator || selfRef?.navigator

  return {
    window: windowRef,
    document: documentRef,
    self: selfRef,
    navigator: navigatorRef,
    KeyboardEvent: getGlobal('KeyboardEvent') || windowRef?.KeyboardEvent,
    SpeechSynthesisUtterance:
      getGlobal('SpeechSynthesisUtterance') || windowRef?.SpeechSynthesisUtterance,
    speechSynthesis: selfRef?.speechSynthesis || windowRef?.speechSynthesis,
  }
}

export let platform = browserPlatform()

export const configurePlatform = (customPlatform = {}) => {
  const basePlatform = browserPlatform()
  const resolvedCustomPlatform =
    typeof customPlatform === 'function' ? customPlatform(basePlatform) : customPlatform || {}

  platform = {
    ...basePlatform,
    ...resolvedCustomPlatform,
  }

  platform.document = platform.document || platform.window?.document
  platform.navigator = platform.navigator || platform.window?.navigator || platform.self?.navigator
  platform.KeyboardEvent =
    platform.KeyboardEvent || platform.window?.KeyboardEvent || basePlatform.KeyboardEvent
  platform.SpeechSynthesisUtterance =
    platform.SpeechSynthesisUtterance ||
    platform.window?.SpeechSynthesisUtterance ||
    basePlatform.SpeechSynthesisUtterance
  platform.speechSynthesis =
    platform.speechSynthesis || platform.self?.speechSynthesis || platform.window?.speechSynthesis

  return platform
}
