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

import { animationEngine } from '../../launch.js'
import symbols from '../../lib/symbols.js'

const unpackTargets = (component, targets) => {
  if (Array.isArray(targets) === true) {
    for (let i = 0; i < targets.length; i++) {
      if (typeof targets[i] === 'string') {
        targets[i] = component.$select(targets[i])
      }
    }
    return targets
  }
  if (typeof targets === 'string') {
    return component.$select(targets).node
  }
  return targets
}

/**
 * creates a timeline for the component instance
 * @description Creates a timeline for the specified component instance, allowing for complex animation sequences to be defined and controlled.
 * @param {*} component
 * @param {*} params
 * @returns {Object} Timeline control object with various animation methods.
 */
const createTimeline = (component, params) => {
  let timeline = animationEngine.createTimeline(component[symbols.activeAnimations], params)
  return {
    add: (targets, ...args) => {
      targets = unpackTargets(component, targets)
      timeline.add(targets, ...args)
      return timeline
    },
    set: (targets, ...args) => {
      targets = unpackTargets(component, targets)
      timeline.set(targets, ...args)
      return timeline
    },
    sync: (...args) => timeline.sync(...args),
    label: (...args) => timeline.label(...args),
    remove: (...args) => timeline.remove(...args),
    call: (...args) => timeline.call(...args),
    init: () => timeline.init(),
    play: () => timeline.play(),
    reset: () => timeline.reset(),
    reverse: () => timeline.reverse(),
    pause: () => timeline.pause(),
    restart: () => timeline.restart(),
    alternate: () => timeline.alternate(),
    resume: () => timeline.resume(),
    complete: () => timeline.complete(),
    cancel: () => timeline.cancel(),
    seek: (...args) => timeline.seek(...args),
    stretch: (...args) => timeline.stretch(...args),
    refresh: (...args) => timeline.refresh(...args),
    destroy: () => {
      timeline = undefined
    },
  }
}

export default {
  $animatable: {
    value: function (targets, params) {
      targets = unpackTargets(this, targets)
      return animationEngine.createAnimatable(this[symbols.activeAnimations], targets, params)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $animate: {
    value: function (targets, params) {
      targets = unpackTargets(this, targets)
      return animationEngine.createAnimation(this[symbols.activeAnimations], targets, params)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $timeline: {
    value: function (params = {}) {
      return createTimeline(this, params)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $timer: {
    value: function (params) {
      return animationEngine.createTimer(this[symbols.activeAnimations], params)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $cancelAnimations: {
    value: function () {
      animationEngine.cancelAnimations(this[symbols.activeAnimations])
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
