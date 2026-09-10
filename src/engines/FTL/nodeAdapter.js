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

// FTL NodeAdapter skeleton (phase 1 core-only). Implements the
// `src/engines/common/nodeAdapter.js` contract over FTL Elements.
//
// Rules:
// - NEVER leak raw mutation: every `setProp` assigns then calls `el.dirty()`.
//   (`texture`/`text` accessors dirty internally — assigning them is enough,
//   but an extra `dirty()` is harmless and keeps the invariant obvious.)
// - Text nodes: Blits `__textnode` props become `createText()` assigned to
//   `el.text` (FTL decouples text objects from elements). Spike needed for
//   exact canvas-text prop names (see TODO.md).
// - Images: `src`/`texture` props become `createImage()` assigned to
//   `el.texture`. `autoSize` behavior TBD in spike.
// - Events: FTL uses `signal()` (`subscribe` returns unsubscribe), NOT
//   `EventEmitter`. `on('loaded'/'failed')` subscribes to the TEXTURE signals;
//   `inBounds/outOfBounds` subscribe to `el.signals`. Payloads are normalized
//   to `{ w, h, type }` / error.
// - `animate`, `createShader`, `createTexture`, `loadFont` throw `unsupported`
//   in phase 1 by design.

import { unsupported } from '../common/nodeAdapter.js'
import { createTween } from './tween.js'
import { ftlApp } from './launch.js'

const requireApp = () => {
  if (ftlApp === null || ftlApp === undefined) {
    throw new Error('[Blits:FTL] nodeAdapter used before Launch() created ftlApp')
  }
  return ftlApp
}

/**
 * Subscribe to an FTL signal regardless of whether it exposes
 * `subscribe` (FTL signal) or `on` (fallback).
 * @returns {function} unsubscribe function
 */
const subscribeSignal = (sig, cb) => {
  if (sig && typeof sig.subscribe === 'function') return sig.subscribe(cb)
  if (sig && typeof sig.on === 'function') {
    sig.on(cb)
    return () => sig.off && sig.off(cb)
  }
  throw new Error('[Blits:FTL] signal object has neither subscribe nor on')
}

/**
 * FTL only starts loading an element's texture once the element is
 * renderable (`w>0 && h>0`) and in-bounds. Blits text/image nodes often have
 * no explicit size (the renderer measures them, like L3's 1px empty text
 * nodes), which would deadlock: no size -> never in-bounds -> never loads ->
 * autoSize never assigns a size. Break the cycle with a 1x1 provisional
 * size; the real dimensions replace it on load (autoSize) or via set().
 */
const ensureProvisionalSize = (props) => {
  if (!props.w) props.w = 1
  if (!props.h) props.h = 1
}

export default {
  getRoot() {
    return requireApp().root
  },
  createNode(props) {
    const app = requireApp()
    const { parent, ...rest } = props || {}
    if (rest.autoSize === true) ensureProvisionalSize(rest)
    const el = app.createElement(rest)
    if (parent !== undefined && parent !== null) {
      parent.addChild(el)
    }
    return el
  },
  createTextNode(elProps, textProps) {
    const app = requireApp()
    const { parent, ...rest } = elProps || {}
    ensureProvisionalSize(rest)
    const el = app.createElement(rest)
    el.text = app.createText(textProps || {})
    el.dirty()
    if (parent !== undefined && parent !== null) {
      parent.addChild(el)
    }
    return el
  },
  setProp(node, key, value) {
    if (key === 'text') {
      // Full text-object replace path; per-field text updates TBD in spike.
      node.text = value
      node.dirty()
      return
    }
    if (key === 'texture') {
      node.texture = value
      node.dirty()
      return
    }
    node[key] = value
    node.dirty()
    // FTL caches world state (worldTransform, bounds, globalAlpha) per
    // element and only recomputes dirty-listed elements. A write here can
    // move/fade/resize the whole subtree, so descendants must re-resolve
    // too — otherwise children keep stale transforms (e.g. text under a
    // tweened/faded container freezes mid-flight). texture/text carry no
    // child-visible state and skip the walk (handled above).
    if (typeof node.dirtyBranch === 'function') {
      node.dirtyBranch()
    }
  },
  animate(node, key, from, to, settings, write) {
    if (typeof write !== 'function') {
      throw new Error('[Blits:FTL] animate needs a write callback (element-layer routing)')
    }
    return createTween(node, key, from, to, settings, write)
  },
  on(node, evt, cb) {
    if (evt === 'loaded') {
      // FTL texture signals live on the texture, but element signals carry
      // bounds; wire texture-loaded where available, else element signal.
      const tex = node.texture || node._texture
      const sig = (tex && (tex.signals?.loaded || tex.loaded)) || node.signals?.inBounds
      if (sig) return subscribeSignal(sig, () => cb({ w: node.w, h: node.h }, node))
      return subscribeSignal(node.signals.inBounds, () => cb({ w: node.w, h: node.h }, node))
    }
    if (evt === 'failed') {
      const tex = node.texture || node._texture
      const sig = (tex && (tex.signals?.failed || tex.released)) || null
      if (sig) return subscribeSignal(sig, (err) => cb(err, node))
      return () => {}
    }
    if (evt === 'inBounds' || evt === 'outOfBounds') {
      return subscribeSignal(node.signals[evt], () => cb(node))
    }
    throw new Error(
      `[Blits:FTL] unsupported event '${evt}' (phase 1: loaded/failed/inBounds/outOfBounds)`
    )
  },
  off(unsub) {
    // FTL `subscribe` returns an unsubscribe fn; adapter `on` returns it, so
    // `off` just invokes it. Kept as a named method for interface parity.
    if (typeof unsub === 'function') unsub()
  },
  destroy(node) {
    node.destroy()
  },
  getParent(node) {
    return (node && node.parent) || null
  },
  getChildren(node) {
    return (node && node.children) || []
  },
  getId(node) {
    return node && node.id
  },
  createShader() {
    return unsupported('createShader')
  },
  createTexture() {
    return unsupported('createTexture')
  },
  loadFont() {
    return unsupported('loadFont')
  },
}
