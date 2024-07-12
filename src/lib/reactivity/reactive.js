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

import { track, trigger, pauseTracking, resumeTracking } from './effect.js'
import symbols from '../symbols.js'

const arrayPatchMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort']

const proxyMap = new WeakMap()

export const getRaw = (value) => {
  const raw = value && value[symbols.raw]
  return raw ? getRaw(raw) : value
}

const reactiveProxy = (original, _parent = null, _key) => {
  // don't create a proxy when a Blits component is assigned to a state variable
  if (typeof original === 'object' && original[symbols.id]) {
    return original
  }

  // if original object is already a proxy, don't create a new one but return the existing one instead
  const existingProxy = proxyMap.get(original)
  if (existingProxy) {
    return existingProxy
  }

  const handler = {
    get(target, key, receiver) {
      // return the original object instead of the proxied
      if (key === symbols.raw) {
        return original
      }

      // handling arrays
      if (Array.isArray(target)) {
        if (typeof target[key] === 'object' && target[key] !== null) {
          if (Array.isArray(target[key])) {
            track(target, key)
          }
          // create a new reactive proxy
          return reactiveProxy(getRaw(target[key]), target, key)
        }
        // augment array path methods (that change the length of the array)
        if (arrayPatchMethods.indexOf(key) !== -1) {
          return function (...args) {
            pauseTracking()
            const result = target[key].apply(this, args)
            resumeTracking()
            // trigger a change on the parent object and the key
            // i.e. when pushing a new item to `obj.data`, _parent will equal `obj`
            // and _key will equal `data`
            trigger(_parent, _key)
            return result
          }
        }
        if (key === 'length') {
          return original.length
        }

        return Reflect.get(target, key, receiver)
      }

      // handling objects (but not null values, which have object type in JS)
      if (typeof target[key] === 'object' && target[key] !== null) {
        if (Array.isArray(target[key])) {
          track(target, key)
        }
        // create a new reactive proxy
        return reactiveProxy(getRaw(target[key]), target, key)
      }

      // handling all other types
      // track the key on the target
      track(target, key)
      // return the reflected value
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      // get the raw values (without proxy wrapper) so we can compare them
      const oldRawValue = getRaw(target[key])
      const rawValue = getRaw(value)

      let result = true
      if (oldRawValue !== rawValue) {
        result = Reflect.set(target, key, value, receiver)
      }

      if (result && oldRawValue !== rawValue) {
        // if we're assigning an array key directly trigger reactivity on the parent key as well
        if (Array.isArray(target) && key in target) {
          trigger(_parent, _key, true)
        }
        trigger(target, key, true)
      }
      return result
    },
  }

  const proxy = new Proxy(original, handler)
  proxyMap.set(original, proxy)
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
        // todo: support assigning array (as we do with proxies)
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
