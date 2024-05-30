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

import symbols from '../../lib/symbols.js'

import { renderer } from '../../launch.js'

export default {
  [symbols.renderer]: {
    value: () => renderer,
    writable: false,
    enumerable: true,
    configurable: false,
  },
  [symbols.getChildren]: {
    value() {
      const parent = this.rootParent || this.parent
      return (this[symbols.children] || []).concat(
        (parent &&
          parent[symbols.getChildren]()
            .map((child) => {
              if (Object.getPrototypeOf(child) === Object.prototype) {
                return Object.values(child).map((c) => {
                  // ugly hack .. but the point is to reference the right component
                  c.forComponent = c.config && c.config.parent.component
                  return c
                })
              }
              return child
            })
            .flat()
            .filter((child) => {
              // problem is that component of a forloop in a slot has component of root component
              if (child && child.component) {
                return (
                  (child.component && child.component.componentId === this.componentId) ||
                  (child.forComponent && child.forComponent.componentId === this.componentId)
                )
              }
            })) ||
          []
      )
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
