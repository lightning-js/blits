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

// counter that tracks all pauseTracking invocations
// to ensure nested array operations don't prematurely
// resume before all operations have completed
let pauseCounter = 0

export const pauseTracking = () => {
  pauseCounter++
}

export const resumeTracking = () => {
  if (pauseCounter > 0) pauseCounter--
}

const objectMap = new WeakMap()
const effectDependenciesMap = new WeakMap()

export const removeEffects = (effectsToRemove) => {
  for (let i = 0; i < effectsToRemove.length; i++) {
    const effect = effectsToRemove[i]
    const dependencies = effectDependenciesMap.get(effect)
    if (dependencies === undefined) continue
    for (let j = 0; j < dependencies.length; j++) {
      dependencies[j].delete(effect)
    }
    effectDependenciesMap.delete(effect)
  }
}

export const track = (target, key) => {
  if (currentEffect !== null) {
    if (pauseCounter > 0) {
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
    if (effects.has(currentEffect) === false) {
      let dependencies = effectDependenciesMap.get(currentEffect)
      if (dependencies === undefined) {
        dependencies = []
        effectDependenciesMap.set(currentEffect, dependencies)
      }
      dependencies.push(effects)
      effects.add(currentEffect)
    }
  }
}

export const trigger = (target, key, force = false) => {
  if (pauseCounter > 0) return
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

export const effect = (effectFn, key = null) => {
  const previousEffect = currentEffect
  const previousKey = currentKey

  currentEffect = effectFn
  currentKey = key

  try {
    effectFn()
  } finally {
    currentEffect = previousEffect
    currentKey = previousKey
  }
}
