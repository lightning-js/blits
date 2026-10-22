/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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

import symbols from '../lib/symbols.js'

/**
 * Recursive function that retrieves the ancestors of a component
 * @param {Array} components
 * @returns array components
 */
export const getAncestors = (components) => {
  if (components[0][symbols.parent] !== undefined) {
    components.unshift(components[0][symbols.parent])
    return getAncestors(components)
  }
  return components
}

/**
 * Checks whether a component and its ancestors are alive. When root is provided,
 * the component must also belong to that root's tree.
 * @param {Object|undefined|null} component
 * @param {Object|undefined|null} [root]
 * @returns {boolean}
 */
export const isInAliveComponentTree = (component, root) => {
  let current = component

  while (current !== undefined && current !== null) {
    if (current.eol === true) return false
    if (root !== undefined && current === root) return true
    current = current[symbols.parent]
  }

  return root === undefined
}
