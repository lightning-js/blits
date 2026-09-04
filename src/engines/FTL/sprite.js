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

// Native sprite bridge (`<Sprite image map frame>`): resolves the sprite
// sheet frame to an FTL texture. Mirrors L3 `spriteTexture.js` option
// resolution, but targets FTL textures — `createImage({src})` for the sheet,
// `createTexture('subtexture', {baseTexture, x, y, w, h})` for the frame.
// The FTL texture manager dedups by cache key, so no per-element texture
// cache is needed (unlike L3); element state only tracks the assigned
// texture plus `@loaded`/`@error` subscriptions.
//
// Notes:
// - FTL textures signal `loaded`/`released` only — there is no failure
//   event, so `@error` warns once (same as the `src` path).
// - Frame dims fall back to 0 (FTL `| 0`); `map.defaults` merge matches L3.

import { Log } from '../../lib/log.js'

const warned = {}
const warnOnce = (key, msg) => {
  if (warned[key] === true) return
  warned[key] = true
  Log.warn(`[Blits:FTL] ${msg}`)
}

/**
 * Resolve frame options from a sprite map + frame value (ported from L3).
 * Supports `{defaults, frames: {name: {...}}}` maps, flat `{name: {...}}`
 * maps, and inline option objects as `frame`.
 * @param {any} map
 * @param {any} frame
 * @returns {{ x?: number, y?: number, w?: number, h?: number }|null}
 */
export const resolveFrameOptions = (map, frame) => {
  if (map != null && frame != null) {
    if (map.frames != null && map.frames !== undefined && frame in map.frames) {
      return Object.assign({}, map.defaults || {}, map.frames[frame])
    }
    if (typeof frame === 'string' && frame in map) {
      return map[frame]
    }
  }

  if ((map === null || map === undefined) && typeof frame === 'object' && frame !== null) {
    return frame
  }
  if (typeof frame === 'object' && frame !== null && map != null) {
    return frame
  }
  return null
}

/**
 * Unique key for a frame value (stringified objects), for change detection.
 * @param {any} frame
 */
export const spriteFrameKey = (frame) =>
  typeof frame === 'object' && frame !== null ? JSON.stringify(frame) : frame

/**
 * Resolve the FTL texture for sprite raw props.
 * @param {{ createImage: function, createTexture: function }|null} ftlApp
 * @param {{ image?: any, map?: any, frame?: any }} raw
 * @returns {any|null} FTL texture or null when image is absent/app not ready.
 */
export const resolveSpriteTexture = (ftlApp, raw) => {
  const image = raw !== undefined && raw !== null ? raw.image : undefined
  if (image === undefined || image === null || image === '') return null
  if (ftlApp === null || ftlApp === undefined) return null

  const base = ftlApp.createImage({ src: image })
  const options = resolveFrameOptions(raw.map, raw.frame)
  if (options === null || options === undefined) return base
  return ftlApp.createTexture('subtexture', {
    baseTexture: base,
    x: options.x,
    y: options.y,
    w: options.w,
    h: options.h,
  })
}

/**
 * Subscribe `@loaded` on a sprite texture. FTL has no failure signal, so
 * `@error` warns once (parity with the `src` image path).
 * @param {any} tex - FTL texture.
 * @param {{ '@loaded'?: function, '@error'?: function }} raw
 * @param {any} element - Blits element (callback `this` arg).
 * @returns {function} unsubscribe function.
 */
export const subscribeSpriteEvents = (tex, raw, element) => {
  if (tex === null || tex === undefined) return () => {}
  const loaded = raw !== undefined && raw !== null ? raw['@loaded'] : undefined
  const error = raw !== undefined && raw !== null ? raw['@error'] : undefined
  let unsub = () => {}
  if (typeof loaded === 'function' && tex.signals !== undefined && tex.signals !== null) {
    const cb = (t) => {
      const w = t !== undefined && t !== null && t.width !== undefined ? t.width : undefined
      const h = t !== undefined && t !== null && t.height !== undefined ? t.height : undefined
      loaded({ w, h }, element)
    }
    unsub = tex.signals.loaded.subscribe(cb)
  }
  if (typeof error === 'function') {
    warnOnce('sprite-error', '`@error` on sprites has no FTL failure signal and never fires')
  }
  return unsub
}
