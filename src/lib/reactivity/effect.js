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

import { queueJob, invalidateJob } from './scheduler.js'

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
const effectDeps = new WeakMap()
const effectKeys = new WeakMap()
const collecting = new Map()

export const removeEffects = (effectsToRemove) => {
  for (let i = 0; i < effectsToRemove.length; i++) {
    const effect = effectsToRemove[i]
    invalidateJob(effect)
    const dependencies = effectDeps.get(effect)
    if (dependencies === undefined) continue
    for (const effects of dependencies) {
      effects.delete(effect)
    }
    effectDeps.delete(effect)
    effectKeys.delete(effect)
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
    const collected = collecting.get(currentEffect)
    if (collected !== undefined) {
      if (collected.has(effects) === false) {
        collected.add(effects)
        effects.add(currentEffect)
      }
      return
    }
    if (effects.has(currentEffect) === false) {
      effects.add(currentEffect)
      let dependencies = effectDeps.get(currentEffect)
      if (dependencies === undefined) {
        dependencies = new Set()
        effectDeps.set(currentEffect, dependencies)
      }
      dependencies.add(effects)
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
    // Queue instead of running inline so N synchronous sets that
    // touch the same effect collapse into a single microtask flush
    // (Vue2 `queueWatcher`).
    for (let effect of effects) {
      queueJob(effect, force)
    }
  }
}

/**
 * Run `fn` with `effectFn` (and `key` filter) installed as the tracking
 * target, restoring the previous tracking state afterwards.
 *
 * @param {Function} effectFn - Effect to attribute tracked dependencies to.
 * @param {string|string[]|null} key - Key filter for tracking, if any.
 * @param {Function} fn - Function to run under the tracking context.
 * @returns {*} The return value of `fn`.
 */
export const withTracking = (effectFn, key, fn) => {
  const previousEffect = currentEffect
  const previousKey = currentKey

  currentEffect = effectFn
  currentKey = key

  try {
    return fn()
  } finally {
    currentEffect = previousEffect
    currentKey = previousKey
  }
}

/**
 * Run `collectFn` with `fn` installed as the tracking target, collecting
 * the touched dependency sets and unsubscribing `fn` from sets that were
 * not touched (stale branches). Mirrors Vue2 `Watcher.get/cleanupDeps`.
 *
 * @param {Function} fn - Effect owning the collected dependencies.
 * @param {string|string[]|null} key - Key filter for tracking, if any.
 * @param {Function} collectFn - Function to run while collecting.
 * @returns {*} The return value of `collectFn`.
 */
export const trackCollected = (fn, key, collectFn) => {
  const previous = effectDeps.get(fn)
  const collected = new Set()
  collecting.set(fn, collected)
  try {
    return withTracking(fn, key, collectFn)
  } finally {
    collecting.delete(fn)
    if (previous !== undefined) {
      for (const effects of previous) {
        if (collected.has(effects) === false) {
          effects.delete(fn)
        }
      }
    }
    effectDeps.set(fn, collected)
  }
}

/**
 * Run a registered effect with its key filter, refreshing its dependency
 * subscriptions. Used by the scheduler flush for re-runs.
 *
 * @param {Function} fn - Effect to run, previously registered via `effect`.
 * @param {*} arg - Argument passed through to the effect (e.g. force flag).
 * @returns {*} The return value of the effect.
 */
export const runEffect = (fn, arg) => {
  const key = effectKeys.get(fn)
  return trackCollected(fn, key === undefined ? null : key, () => fn(arg))
}

export const effect = (effectFn, key = null) => {
  effectKeys.set(effectFn, key)
  return runEffect(effectFn)
}
