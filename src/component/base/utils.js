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

/** Keyed `:for` elms entries are plain objects of Blits elements; other POJOs stay as single items. */
const flattenChildBuckets = (children) =>
  (children || []).flatMap((child) => {
    if (child == null || Object.getPrototypeOf(child) !== Object.prototype) return [child]
    const vals = Object.values(child)
    const isBucket =
      vals.length > 0 &&
      vals.every((v) => v != null && typeof v === 'object' && v.component !== undefined)
    if (!isBucket) return [child]
    return vals.map((c) => {
      c.forComponent = c[Symbol.for('config')] && c[Symbol.for('config')][symbols.parent].component
      return c
    })
  })

export default {
  $size: {
    value: function (dimensions = { w: 0, h: 0 }) {
      this[symbols.holder].set('w', dimensions.w || 0)
      this[symbols.holder].set('h', dimensions.h || 0)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $parent: {
    get: function () {
      return this[symbols.parent]
    },
    enumerable: true,
    configurable: false,
  },
  $id: {
    get: function () {
      return this[symbols.id]
    },
    enumerable: true,
    configurable: false,
  },
  [symbols.renderer]: {
    value: () => renderer,
    writable: false,
    enumerable: true,
    configurable: false,
  },
  [symbols.getChildren]: {
    value() {
      const parent = this[symbols.rootParent] || this[symbols.parent]
      return flattenChildBuckets(this[symbols.children] || []).concat(
        (parent &&
          flattenChildBuckets(parent[symbols.getChildren]()).filter((child) => {
            // for-loop in slot: child may use forComponent instead of component
            if (child && child.component) {
              return (
                child.component.$componentId === this.$componentId ||
                (child.forComponent && child.forComponent.$componentId === this.$componentId)
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
