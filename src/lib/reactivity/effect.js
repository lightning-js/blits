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

export const track = (target, key) => {
  if (currentEffect) {
    if (paused) {
      return
    }
    if (currentKey !== null && key !== currentKey) {
      return
    }
    let effectsMap = objectMap.get(target)
    if (!effectsMap) {
      effectsMap = new Map()
      objectMap.set(target, effectsMap)
    }
    let effects = effectsMap.get(key)
    if (!effects) {
      effects = new Set()
      effectsMap.set(key, effects)
    }
    effects.add(currentEffect)
  }
}

export const trigger = (target, key, force = false) => {
  if (paused === true) return
  const effectsMap = objectMap.get(target)
  if (!effectsMap) {
    return
  }
  const effects = effectsMap.get(key)
  if (effects) {
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
