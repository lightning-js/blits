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

let currentEffect = null
let currentKey = null

let paused = false

export const pauseTracking = () => {
  paused = true
}

export const resumeTracking = () => {
  paused = false
}

const objectMap = new WeakMap()
const globalEffectsMap = new Map()

export const removeGlobalEffects = (effectsToRemove) => {
  if (globalEffectsMap.size === 0 || effectsToRemove.length === 0) return
  const effectsToRemoveSet = new Set(effectsToRemove)
  for (const [effect, target] of globalEffectsMap) {
    if (!effectsToRemoveSet.has(effect)) continue
    const effectsSet = objectMap.get(target)
    if (effectsSet === undefined) continue
    for (const set of effectsSet.values()) {
      set.delete(effect)
      globalEffectsMap.delete(effect)
    }
  }
}

export const track = (target, key, global = false) => {
  if (currentEffect !== null) {
    if (paused) {
      return
    }
    // note: nesting the conditions like this seems to perform better ¯\_(ツ)_/¯
    if (Array.isArray(currentKey) === true) {
      if (currentKey.includes(key) === false) return
    } else if (currentKey !== null && key !== currentKey) return

    let effectsMap = objectMap.get(target)
    if (effectsMap === undefined) {
      effectsMap = new Map()
      objectMap.set(target, effectsMap)
    }
    let effects = effectsMap.get(key)
    if (effects === undefined) {
      effects = new Set()
      effectsMap.set(key, effects)
    }
    effects.add(currentEffect)

    if (global === true) globalEffectsMap.set(currentEffect, target)
  }
}

export const trigger = (target, key, force = false) => {
  if (paused === true) return
  const effectsMap = objectMap.get(target)
  if (effectsMap === undefined) {
    return
  }
  const effects = effectsMap.get(key)
  if (effects !== undefined) {
    for (let effect of effects) {
      effect(force)
    }
  }
}

export const effect = (effect, key = null) => {
  currentEffect = effect
  currentKey = key
  currentEffect()
  currentEffect = null
  currentKey = null
}
