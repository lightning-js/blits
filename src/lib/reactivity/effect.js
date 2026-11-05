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

import symbols from '../symbols.js'

let currentEffect = null
let currentKey = null
// Write position for dependency-array reuse, restored after nested computed getters.
let computedDependencyIndex = 0

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
const computedEffects = new WeakMap()
const effectQueue = new Map()
let pendingEffects = null

const flushEffects = (queue) => {
  for (const effect of queue.keys()) {
    const force = queue.get(effect)
    queue.delete(effect)
    if (effectDependenciesMap.has(effect) === true) effect(force)
  }
}

// Keep invalidation synchronous, but defer consumers until the outermost batch exits.
export const batch = function (callback) {
  if (pendingEffects !== null) return callback.call(this)
  const queue = effectQueue.size === 0 ? effectQueue : new Map()
  pendingEffects = queue
  let result
  let callbackError
  let callbackFailed = false
  try {
    result = callback.call(this)
  } catch (error) {
    callbackError = error
    callbackFailed = true
  } finally {
    pendingEffects = null
  }
  try {
    flushEffects(queue)
  } catch (error) {
    // Keep the original callback error when flushing fails as well.
    if (callbackFailed === false) throw error
  } finally {
    queue.clear()
  }
  if (callbackFailed === true) throw callbackError
  return result
}

const computedRunner = (effectFn, key) => {
  if (effectFn.computed === true) return effectFn
  let runner = computedEffects.get(effectFn)
  if (runner === undefined) {
    runner = (force) => effect(effectFn, key, force)
    computedEffects.set(effectFn, runner)
  }
  return runner
}

export const createComputed = (getter, component, key) => {
  let value
  let status = 'dirty'
  let dirtyForce = false

  const invalidate = (force) => {
    if (status === 'disposed') return
    if (status === 'dirty' && (dirtyForce === true || force !== true)) return
    status = 'dirty'
    // A later forced notification must upgrade consumers already queued by this cache.
    dirtyForce = force
    trigger(component, key, force)
  }
  invalidate.computed = true
  invalidate.dispose = () => {
    value = undefined
    status = 'disposed'
  }
  if (component[symbols.effects] !== undefined) component[symbols.effects].push(invalidate)

  return () => {
    if (status === 'disposed') return undefined

    if (currentEffect !== null) track(component, key, true)
    if (status === 'clean') return value

    const previousEffect = currentEffect
    const previousKey = currentKey
    const previousPauseCounter = pauseCounter
    const previousDependencyIndex = computedDependencyIndex
    computedDependencyIndex = 0
    try {
      // Refresh dependencies in isolation, including reads made outside effects.
      clearDependencies(invalidate)
      currentEffect = invalidate
      currentKey = null
      pauseCounter = 0
      value = getter.call(component)
      status = 'clean'
      return value
    } catch (error) {
      status = 'failed'
      throw error
    } finally {
      const dependencies = effectDependenciesMap.get(invalidate)
      if (dependencies !== undefined) dependencies.length = computedDependencyIndex
      computedDependencyIndex = previousDependencyIndex
      currentEffect = previousEffect
      currentKey = previousKey
      pauseCounter = previousPauseCounter
    }
  }
}

const clearDependencies = (effect, releaseStorage) => {
  const dependencies = effectDependenciesMap.get(effect)
  if (dependencies === undefined) return
  for (let i = 0; i < dependencies.length; i++) {
    const effects = dependencies[i]
    effects.delete(effect)
    if (effect.computed === true) effects.computedCount--
  }
  if (releaseStorage === true) dependencies.length = 0
}

export const removeEffects = (effectsToRemove) => {
  for (let i = 0; i < effectsToRemove.length; i++) {
    const effect = effectsToRemove[i]
    const computedEffect = computedEffects.get(effect)
    if (computedEffect !== undefined) {
      // Computed dependencies subscribe the runner itself, so unsubscribe it separately.
      clearDependencies(computedEffect, true)
      effectDependenciesMap.delete(computedEffect)
      computedEffects.delete(effect)
    }
    clearDependencies(effect, true)
    effectDependenciesMap.delete(effect)
    if (effect.computed === true) effect.dispose()
  }
}

export const track = (target, key, computed) => {
  if (currentEffect !== null) {
    if (pauseCounter > 0) {
      return
    }
    // note: nesting the conditions like this seems to perform better ¯\_(ツ)_/¯
    if (Array.isArray(currentKey) === true) {
      if (currentKey.includes(key) === false) return
    } else if (currentKey !== null && key !== currentKey) return

    const subscriber = computed === true ? computedRunner(currentEffect, currentKey) : currentEffect
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
    if (effects.has(subscriber) === false) {
      let dependencies = effectDependenciesMap.get(subscriber)
      if (dependencies === undefined) {
        dependencies = []
        effectDependenciesMap.set(subscriber, dependencies)
      }
      effects.add(subscriber)
      if (subscriber.computed === true) {
        dependencies[computedDependencyIndex++] = effects
        effects.computedCount = effects.computedCount === undefined ? 1 : effects.computedCount + 1
      } else {
        dependencies.push(effects)
      }
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
  // Ordinary state updates keep their direct path.
  if (
    effects !== undefined &&
    pendingEffects === null &&
    (effects.computedCount === undefined || effects.computedCount === 0)
  ) {
    for (const effect of effects) {
      if (effect.computed !== true) effect(force)
    }
    return
  }
  if (effects !== undefined) {
    const parentQueue = pendingEffects
    // Reuse the root queue; only nested updates with pending consumers need another queue.
    let queue = parentQueue
    if (queue === null) {
      queue = effectQueue.size === 0 ? effectQueue : new Map()
    }
    pendingEffects = queue
    try {
      for (const effect of effects) {
        if (effect.computed === true) {
          effect(force)
        } else {
          const runner = computedEffects.get(effect)
          const consumer = runner === undefined ? effect : runner
          // Preserve force for this consumer without forcing unrelated consumers.
          if (force === true || queue.has(consumer) === false) queue.set(consumer, force)
        }
      }
      // Invalidate the whole computed chain before any consumer can read its cache.
      if (parentQueue === null) {
        pendingEffects = null
        flushEffects(queue)
      }
    } finally {
      pendingEffects = parentQueue
      if (parentQueue === null) queue.clear()
    }
  }
}

export const effect = (effectFn, key = null, force) => {
  const previousEffect = currentEffect
  const previousKey = currentKey

  currentEffect = effectFn
  currentKey = key

  try {
    effectFn(force)
  } finally {
    currentEffect = previousEffect
    currentKey = previousKey
  }
}
