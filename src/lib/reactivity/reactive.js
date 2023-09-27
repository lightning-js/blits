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

import { track, trigger } from './effect.js'

const arrayMethods = [
  'constructor',
  'includes',
  'indexOf',
  'lastIndexOf',
  'push',
  'pop',
  'shift',
  'splice',
  'unshift',
]
const reactiveProxy = (target) => {
  const handler = {
    get(target, key, receiver) {
      if (Array.isArray(target) && arrayMethods.includes(key)) {
        return Reflect.get(target, key, receiver)
      }
      track(target, key)

      if (
        typeof target[key] === 'object' &&
        Object.getPrototypeOf(target[key]) === Object.prototype
      ) {
        return reactiveProxy(target[key])
      }

      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]

      const result = Reflect.set(target, key, value, receiver)

      if (typeof result === 'object') {
        reactiveProxy(target[key])
      }

      if (key === 'length') {
        trigger(target, key)
      } else {
        if (result && oldValue !== value) {
          trigger(target, key)
        }
      }
      return result
    },
  }
  return new Proxy(target, handler)
}

const reactiveDefineProperty = (target) => {
  Object.keys(target).forEach((key) => {
    let internalValue = target[key]

    if (
      typeof target[key] === 'object' &&
      Object.getPrototypeOf(target[key]) === Object.prototype
    ) {
      return reactiveDefineProperty(target[key])
    }

    Object.defineProperty(target, key, {
      enumerable: true, // ?
      configurable: true, // ?
      get() {
        track(target, key)
        return internalValue
      },
      set(newValue) {
        let oldValue = internalValue
        if (oldValue !== newValue) {
          internalValue = newValue
          trigger(target, key)
        }
      },
    })
  })

  return target
}

// maybe an options object?
export const reactive = (target, type = 'proxy') => {
  return type === 'proxy' ? reactiveProxy(target) : reactiveDefineProperty(target)
}

export const memo = (raw) => {
  const r = {
    get value() {
      track(r, 'value')
      return raw
    },
    set value(v) {
      raw = v
      trigger(r, 'value')
    },
  }
  return r
}
