/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

// FTL tween bridge: emulates the L3 `IAnimationController` contract
// (start/stop/state/once/on with animating/tick/stopped events) on top of
// AnimeJS, driven by FTL's own rAF loop (`signals.tick` + `addActiveCheck`,
// wired in launch.js).
//
// Design notes:
// - AnimeJS animates a private proxy object, never the FTL node. Every frame
//   the eased value is written through the caller-provided `write` callback
//   (which routes via `applySingleProp`/`setProp` and `dirty()`s).
// - Easing parity with L3 is exact, not approximate: the L3 renderer defines
//   every Blits easing as cubic-bezier parameters
//   (@lightningjs/renderer `core/utils.ts` `timingLookup`), and AnimeJS v4
//   accepts easing *functions* — so each Blits name maps to
//   `cubicBezier(...params)` with identical curves.
// - `runningTweens` backs `addActiveCheck`, keeping FTL's loop alive without
//   touching AnimeJS privates (`engine._head`).
// - The AnimeJS module is injectable (`setAnimationEngine`) so tests run
//   without the optional peer installed. Production loads it lazily via
//   `ensureAnimationEngine()` (static specifier → stays in the FTL chunk).

import { Log } from '../../lib/log.js'

/**
 * L3 cubic-bezier parameters per Blits easing name. Copied from
 * @lightningjs/renderer `src/core/utils.ts` `timingLookup` — the source of
 * truth for what L3 renders, so FTL tweens follow identical curves.
 */
const easingParams = {
  ease: [0.25, 0.1, 0.25, 1.0],
  'ease-in': [0.42, 0, 1.0, 1.0],
  'ease-out': [0, 0, 0.58, 1.0],
  'ease-in-out': [0.42, 0, 0.58, 1.0],
  'ease-in-sine': [0.12, 0, 0.39, 0],
  'ease-out-sine': [0.12, 0, 0.39, 0],
  'ease-in-out-sine': [0.37, 0, 0.63, 1],
  'ease-in-cubic': [0.32, 0, 0.67, 0],
  'ease-out-cubic': [0.33, 1, 0.68, 1],
  'ease-in-out-cubic': [0.65, 0, 0.35, 1],
  'ease-in-circ': [0.55, 0, 1, 0.45],
  'ease-out-circ': [0, 0.55, 0.45, 1],
  'ease-in-out-circ': [0.85, 0, 0.15, 1],
  'ease-in-back': [0.36, 0, 0.66, -0.56],
  'ease-out-back': [0.34, 1.56, 0.64, 1],
  'ease-in-out-back': [0.68, -0.6, 0.32, 1.6],
}

const warnedEasing = {}

/** @type {{ engine: any, animate: function, cubicBezier: function }|null} */
let animationEngine = null

let runningTweens = 0

/**
 * Inject the animation backend (AnimeJS module shape). Used by tests and by
 * `ensureAnimationEngine()` after dynamic import.
 * @param {{ engine: any, animate: function, cubicBezier: function }} mod
 */
export const setAnimationEngine = (mod) => {
  animationEngine = mod
}

/**
 * Load AnimeJS on first use (optional peer `animejs`). Static specifier so
 * bundlers keep it in the FTL chunk; L3 bundles never see it.
 * @returns {Promise<{ engine: any, animate: function, cubicBezier: function }>}
 */
export const ensureAnimationEngine = async () => {
  if (animationEngine !== null) return animationEngine
  let mod
  try {
    mod = await import('animejs')
  } catch {
    throw new Error(
      '[Blits:FTL] arrange transitions need the `animejs` peer dependency (`npm i animejs`)'
    )
  }
  animationEngine =
    mod && mod.engine && mod.animate && mod.cubicBezier
      ? { engine: mod.engine, animate: mod.animate, cubicBezier: mod.cubicBezier }
      : null
  if (animationEngine === null) {
    throw new Error(
      '[Blits:FTL] installed `animejs` has an unexpected shape (need engine/animate/cubicBezier)'
    )
  }
  return animationEngine
}

/** Number of currently running tweens. Backs `addActiveCheck` in launch.js. */
export const hasRunningTweens = () => runningTweens > 0

/**
 * Resolve a Blits easing name to an AnimeJS easing function. Requires a
 * loaded engine (call `ensureAnimationEngine()` first).
 * @param {string} [easing] - Blits easing name or `cubic-bezier(a,b,c,d)`.
 * @returns {function|string} AnimeJS easing (function) or 'linear' fallback.
 */
export const resolveEasing = (easing) => {
  const name = easing === undefined || easing === null ? 'ease' : easing
  if (animationEngine === null) return 'linear'
  if (typeof name === 'string' && easingParams[name] !== undefined) {
    const p = easingParams[name]
    return animationEngine.cubicBezier(p[0], p[1], p[2], p[3])
  }
  if (typeof name === 'string') {
    const match = name.match(/-?\d*\.?\d+/g)
    if (match !== null && match.length >= 4) {
      const p = [
        parseFloat(match[0]),
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3]),
      ]
      return animationEngine.cubicBezier(p[0], p[1], p[2], p[3])
    }
  }
  if (warnedEasing[name] !== true) {
    warnedEasing[name] = true
    Log.warn(`[Blits:FTL] unknown easing '${name}', falling back to linear`)
  }
  return 'linear'
}

/**
 * Create a tween controller emulating L3's animation controller.
 *
 * @param {any} node - FTL element (used for the wake-up `dirty()` on start).
 * @param {string} key - Transformed prop name (informational; values flow via `write`).
 * @param {number|number[]} from - Start value (number or [r,g,b,a] array).
 * @param {number|number[]} to - End value.
 * @param {{ duration?: number, easing?: string, delay?: number }} [settings]
 * @param {(value: number|number[]) => void} write - Writes the eased value (dirties).
 * @returns {{ start: function, stop: function, state: string, once: function, on: function }}
 */
export const createTween = (node, key, from, to, settings = {}, write) => {
  const duration =
    settings !== undefined && typeof settings.duration === 'number' ? settings.duration : 300
  const delay = settings !== undefined && typeof settings.delay === 'number' ? settings.delay : 0
  const ease = resolveEasing(settings !== undefined ? settings.easing : undefined)

  const subs = { animating: [], tick: [], stopped: [] }
  const fire = (evt, ...args) => {
    const list = subs[evt] || []
    for (let i = 0; i < list.length; i++) {
      try {
        list[i](...args)
      } catch (e) {
        Log.error(`[Blits:FTL] tween '${evt}' listener failed`, e)
      }
    }
    if (evt !== 'tick') subs[evt] = []
  }

  const isArray = Array.isArray(to)
  const count = isArray ? to.length : 1
  const fromChannels = isArray ? from : [from]

  const readProxy = (proxy) => {
    if (isArray !== true) return proxy.v
    const out = []
    for (let i = 0; i < count; i++) out.push(proxy['c' + i])
    return out
  }

  const controller = {
    state: 'scheduled',
    canceled: false,
    _anim: undefined,
    _finished: false,
    once(evt, cb) {
      if (subs[evt] === undefined) return
      const wrapper = (...args) => {
        const idx = subs[evt].indexOf(wrapper)
        if (idx !== -1) subs[evt].splice(idx, 1)
        cb(...args)
      }
      subs[evt].push(wrapper)
    },
    on(evt, cb) {
      if (subs[evt] === undefined) return
      subs[evt].push(cb)
    },
    start() {
      if (controller.state !== 'scheduled') return
      if (animationEngine === null) {
        throw new Error('[Blits:FTL] cannot start tween: animation engine not loaded')
      }
      controller.state = 'running'
      runningTweens++
      // Wake FTL's (possibly idle) loop; per-frame writes keep it alive after.
      if (node !== undefined && node !== null && typeof node.dirty === 'function') {
        node.dirty()
      }

      const proxy = {}
      const target = {}
      if (isArray === true) {
        for (let i = 0; i < count; i++) {
          proxy['c' + i] = fromChannels[i]
          target['c' + i] = to[i]
        }
      } else {
        proxy.v = fromChannels[0]
        target.v = to
      }

      const anim = animationEngine.animate(proxy, {
        ...target,
        duration,
        delay,
        ease,
        autoplay: false,
        onBegin: () => {
          fire('animating')
        },
        onUpdate: (self) => {
          write(readProxy(proxy))
          fire('tick', node, {
            progress: self !== undefined && self.progress !== undefined ? self.progress : 0,
          })
        },
        onComplete: () => {
          write(isArray === true ? to.slice() : to)
          finish()
        },
      })
      controller._anim = anim
      anim.play()
    },
    stop(skipToEnd = false) {
      if (controller.state === 'stopped') return
      const anim = controller._anim
      if (anim === undefined) {
        // Stopped before start(): never registered as running.
        if (skipToEnd === true) {
          write(isArray === true ? to.slice() : to)
          controller.state = 'stopped'
          fire('stopped')
        } else {
          controller.canceled = true
          controller.state = 'stopped'
        }
        return
      }
      if (skipToEnd === true) {
        // Finish early: AnimeJS `complete()` applies end values and fires
        // onComplete, so `end` callbacks (e.g. awaited router transitions)
        // still run.
        try {
          anim.complete()
        } catch {
          write(isArray === true ? to.slice() : to)
          finish()
        }
        return
      }
      controller.canceled = true
      try {
        anim.cancel()
      } catch {
        // ignore teardown errors
      }
      controller.state = 'stopped'
      runningTweens = Math.max(0, runningTweens - 1)
    },
  }

  const finish = () => {
    if (controller._finished === true) return
    controller._finished = true
    controller.state = 'stopped'
    // A late onComplete after cancel() must not decrement twice or refire.
    if (controller.canceled === true) return
    runningTweens = Math.max(0, runningTweens - 1)
    fire('stopped')
  }

  return controller
}
