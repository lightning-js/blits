/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

import symbols from './symbols.js'

const cbs = {}

export const emit = (hook, identifier, scope, data = []) => {
  cbs[identifier] && cbs[identifier][hook] && cbs[identifier][hook].apply(scope, data)
}

export const privateEmit = (hook, identifier, scope) => {
  const symHook = symbols[hook]
  cbs[identifier] && cbs[identifier][symHook] && cbs[identifier][symHook].apply(scope)
}

export const registerHooks = (hooks = {}, identifier) => {
  cbs[identifier] = {}
  // Combines enumerable keys and symbol properties of the 'hooks' object
  const hookKeys = [...Object.keys(hooks), ...Object.getOwnPropertySymbols(hooks)]
  hookKeys.forEach((hook) => {
    if (typeof hooks[hook] === 'function') cbs[identifier][hook] = hooks[hook]
  })
}
