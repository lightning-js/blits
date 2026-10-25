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

import { Log } from '../../lib/log.js'

import { track, trigger, withTracking } from '../../lib/reactivity/effect.js'

import symbols from '../../lib/symbols.js'

// Per-instance computed caches. Setup runs once per component type while the
// defined getters execute on instances (`this`), so cached values and dirty
// flags live here keyed by instance instead of on the shared base.
const caches = new WeakMap()

/**
 * Get (creating on first use) the cache entry for a computed key on an instance.
 *
 * @param {object} instance - Component instance reading the computed.
 * @param {string} key - Computed key.
 * @returns {{value: *, dirty: boolean, invalidate: Function}} Cache entry.
 */
const getEntry = (instance, key) => {
  let entries = caches.get(instance)
  if (entries === undefined) {
    entries = new Map()
    caches.set(instance, entries)
  }
  let entry = entries.get(key)
  if (entry === undefined) {
    entry = { value: undefined, dirty: true, invalidate: null }
    entry.invalidate = () => {
      entry.dirty = true
      trigger(entry, 'value')
    }
    entries.set(key, entry)
    // register for cleanup with the instance effects so destroy unsubscribes
    const effects = instance[symbols.effects]
    if (effects !== undefined) {
      effects.push(entry.invalidate)
    }
  }
  return entry
}

/**
 * Read a computed value, evaluating the user function at most once per
 * dependency change and subscribing the reader to future invalidations.
 *
 * @param {object} instance - Component instance reading the computed.
 * @param {string} key - Computed key.
 * @param {Function} userFn - User supplied computed function.
 * @returns {*} Cached (or freshly evaluated) computed value.
 */
const readComputed = (instance, key, userFn) => {
  const entry = getEntry(instance, key)
  if (entry.dirty === true) {
    withTracking(entry.invalidate, null, () => {
      entry.value = userFn.apply(instance)
    })
    entry.dirty = false
  }
  track(entry, 'value')
  return entry.value
}

export default (component, computeds) => {
  component[symbols.computedKeys] = []

  for (let computed in computeds) {
    // test for reserved keys?
    if (component[symbols.stateKeys] && component[symbols.stateKeys].indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a state variable`)
    } else if (component[symbols.propKeys] && component[symbols.propKeys].indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (
      component[symbols.methodKeys] &&
      component[symbols.methodKeys].indexOf(computed) > -1
    ) {
      Log.error(`${computed} already exists as a method`)
    } else {
      if (typeof computeds[computed] !== 'function') {
        Log.warn(`${computed} is not a function`)
      }
      const key = computed
      const userFn = computeds[computed]
      component[symbols.computedKeys].push(computed)
      Object.defineProperty(component, computed, {
        get() {
          return readComputed(this, key, userFn)
        },
      })
    }
  }
}
