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

import speechSynthesis from './announcer/speechSynthesis.js'

const globalScope = globalThis

const createKeyboardEventFactory = (KeyboardEventConstructor) => {
  if (KeyboardEventConstructor === undefined) return undefined

  return (type, init = {}) => {
    const event = new KeyboardEventConstructor(type, init)
    if ('keyCode' in init && event.keyCode !== init.keyCode) {
      Object.defineProperty(event, 'keyCode', {
        get: () => init.keyCode,
      })
    }
    return event
  }
}

const browserPlatform = () => {
  const windowRef = globalScope.window
  const documentRef = globalScope.document || (windowRef && windowRef.document)
  const selfRef = globalScope.self || windowRef || globalScope
  const navigatorRef =
    globalScope.navigator || (windowRef && windowRef.navigator) || (selfRef && selfRef.navigator)
  const KeyboardEventConstructor =
    globalScope.KeyboardEvent || (windowRef && windowRef.KeyboardEvent)
  let localStorage

  try {
    localStorage = (windowRef && windowRef.localStorage) || globalScope.localStorage
  } catch {
    localStorage = undefined
  }

  const createKeyboardEvent = createKeyboardEventFactory(KeyboardEventConstructor)

  return {
    input: documentRef,
    viewport: windowRef,
    dispatchEvent:
      documentRef && documentRef.dispatchEvent
        ? documentRef.dispatchEvent.bind(documentRef)
        : undefined,
    localStorage,
    getCookie: () => (documentRef && documentRef.cookie) || '',
    setCookie: (value) => {
      if (documentRef !== undefined) documentRef.cookie = value
    },
    historyBack: () => {
      if (windowRef && windowRef.history && windowRef.history.back) windowRef.history.back()
    },
    screenHeight: windowRef && windowRef.innerHeight,
    hardwareConcurrency: navigatorRef && navigatorRef.hardwareConcurrency,
    userAgent: navigatorRef && navigatorRef.userAgent,
    KeyboardEvent: KeyboardEventConstructor,
    isKeyboardEvent:
      KeyboardEventConstructor !== undefined
        ? (event) => event instanceof KeyboardEventConstructor
        : undefined,
    createKeyboardEvent,
    announcer: speechSynthesis,
    now:
      globalScope.performance && globalScope.performance.now !== undefined
        ? globalScope.performance.now.bind(globalScope.performance)
        : Date.now,
  }
}

export let platform = browserPlatform()

export const configurePlatform = (customPlatform) => {
  const basePlatform = browserPlatform()
  const resolvedCustomPlatform = customPlatform(basePlatform) || {}

  platform = {
    ...basePlatform,
    ...resolvedCustomPlatform,
  }

  platform.KeyboardEvent = platform.KeyboardEvent || basePlatform.KeyboardEvent
  platform.isKeyboardEvent =
    resolvedCustomPlatform.isKeyboardEvent ||
    (platform.KeyboardEvent !== undefined
      ? (event) => event instanceof platform.KeyboardEvent
      : basePlatform.isKeyboardEvent)
  platform.createKeyboardEvent =
    resolvedCustomPlatform.createKeyboardEvent ||
    createKeyboardEventFactory(platform.KeyboardEvent) ||
    basePlatform.createKeyboardEvent
  platform.getCookie = platform.getCookie || basePlatform.getCookie
  platform.setCookie = platform.setCookie || basePlatform.setCookie
  platform.historyBack = platform.historyBack || basePlatform.historyBack
  platform.announcer = platform.announcer || basePlatform.announcer
  platform.now = platform.now || basePlatform.now

  return platform
}
