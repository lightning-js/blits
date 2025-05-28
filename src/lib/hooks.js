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

/**
 * Emits a registered hook for a given identifier, calling the hook with the provided scope and data.
 *
 * @param {string|symbol} hook - The name or symbol of the hook to emit.
 * @param {string} identifier - The unique identifier for the hook set.
 * @param {object} scope - The value of `this` inside the hook function.
 * @param {Array} [data=[]] - Arguments to pass to the hook function.
 */
export const emit = (hook, identifier, scope, data = []) => {
  cbs[identifier] && cbs[identifier][hook] && cbs[identifier][hook].apply(scope, data)
}

/**
 * Emits a registered symbol-based hook for a given identifier, calling the hook with the provided scope.
 *
 * @param {string|symbol} hook - The name or symbol of the hook to emit (will be mapped to a symbol).
 * @param {string} identifier - The unique identifier for the hook set.
 * @param {object} scope - The value of `this` inside the hook function.
 */
export const privateEmit = (hook, identifier, scope) => {
  const symHook = symbols[hook]
  cbs[identifier] && cbs[identifier][symHook] && cbs[identifier][symHook].apply(scope)
}

/**
 * Registers a set of hooks (functions) for a given identifier.
 *
 * @param {Object<string,Function>|Object<symbol,Function>} hooks - An object whose keys are hook names or symbols and values are functions.
 * @param {string} identifier - The unique identifier for the hook set.
 */
export const registerHooks = (hooks = {}, identifier) => {
  cbs[identifier] = {}
  // Combines enumerable keys and symbol properties of the 'hooks' object
  const hookKeys = [...Object.keys(hooks), ...Object.getOwnPropertySymbols(hooks)]
  hookKeys.forEach((hook) => {
    if (typeof hooks[hook] === 'function') cbs[identifier][hook] = hooks[hook]
  })
}
