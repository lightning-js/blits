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
  'sort',
  'reverse',
]

const arrayPatchMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

const proxyMap = new WeakMap()

const reactiveProxy = (target) => {
  const isProxy = proxyMap.get(target)
  if (isProxy) {
    return isProxy
  }

  const handler = {
    get(target, key, receiver) {
      if (Array.isArray(target) && arrayMethods.includes(key)) {
        return Reflect.get(target, key, receiver)
      }
      track(target, key)

      if (target[key] !== null && typeof target[key] === 'object') {
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

  const proxy = new Proxy(target, handler)
  proxyMap.set(target, proxy)
  return proxy
}

const reactiveDefineProperty = (target) => {
  Object.keys(target).forEach((key) => {
    let internalValue = target[key]

    if (target[key] !== null && typeof target[key] === 'object') {
      if (Object.getPrototypeOf(target[key]) === Object.prototype) {
        return reactiveDefineProperty(target[key])
      } else if (Array.isArray(target[key])) {
        for (let i = 0; i < arrayPatchMethods.length - 1; i++) {
          target[key][arrayPatchMethods[i]] = function (v) {
            Array.prototype[arrayPatchMethods[i]].call(this, v)
            trigger(target, key)
          }
        }
      }
    }

    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
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

export const reactive = (target, mode = 'Proxy') => {
  return mode === 'defineProperty' ? reactiveDefineProperty(target) : reactiveProxy(target)
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
