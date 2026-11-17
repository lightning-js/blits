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

// FTL NodeAdapter. Implements the
// `src/engines/common/nodeAdapter.js` contract over FTL Elements.
//
// Rules:
// - NEVER leak raw mutation: every `setProp` assigns then calls `el.dirty()`.
//   (`texture`/`text` accessors dirty internally — assigning them is enough,
//   but an extra `dirty()` is harmless and keeps the invariant obvious.)
// - Descendant invalidation (`dirtyBranch`) runs for inherited state
//   (transform, alpha, visibility, ...). `color`/`w`/`h` carry no
//   child-visible state and skip the walk (`w`/`h` except on RTT roots,
//   where a resize must re-render the framebuffer via member dirties).
// - Text changes must pass through el.text so baked textures, font waiters
//   and glyph caches are invalidated, not just the element's transform.
// - Images: `src`/`texture` props become `createImage()` assigned to
//   `el.texture`. Resource listeners follow subsequent text/texture swaps.
// - Events: FTL uses `signal()` (`subscribe` returns unsubscribe), NOT
//   `EventEmitter`. Resource listeners follow texture/text changes; failure
//   and bounds listeners use stable element signals. Payloads are normalized
//   to `{ w, h, type }` / error.
// - Animation uses the optional AnimeJS bridge. Shaders, textures and fonts
//   are configured by the element/launch bridges rather than this interface.

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

const resourceListeners = new WeakMap()

const bindResourceListener = (node, listener) => {
  if (listener.unsub !== null) listener.unsub()
  listener.unsub = null
  const revision = ++listener.revision
  const text = node.text
  const isText = text !== null && text !== undefined
  const isGlyphText = isText === true && text.type !== 0 && text.type !== 'canvas'
  const tex = node.texture
  const sig = isGlyphText === true ? node.signals.textCalculated : tex?.signals.loaded
  if (sig === undefined || sig === null) return
  const notify = () => {
    if (listener.active !== true || listener.revision !== revision || node._destroyed === true)
      return
    listener.cb({ w: node.w, h: node.h, type: isText === true ? 'text' : 'texture' }, node)
  }
  listener.unsub = subscribeSignal(sig, notify)
  // Warm textures may have emitted before listeners were installed. Defer so
  // callers can finish constructing the component before @loaded is invoked.
  if (isGlyphText === false && tex.isReady === true) queueMicrotask(notify)
}

const refreshResourceListeners = (node) => {
  const listeners = resourceListeners.get(node)
  if (listeners === undefined) return
  for (const listener of listeners) bindResourceListener(node, listener)
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
      ensureProvisionalSize(node)
      node.text = value
      node.dirty()
      refreshResourceListeners(node)
      return
    }
    if (key === 'texture') {
      node.texture = value
      node.dirty()
      refreshResourceListeners(node)
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
    //
    // Narrowing: color/w/h never enter a descendant's worldTransform,
    // bounds or globalAlpha, so the subtree walk is pure overhead for them
    // (e.g. a focus background-color tween dirties 1 node instead of the
    // whole card). w/h are excluded for RTT roots: a root resize changes
    // the framebuffer size, which is only picked up via member dirties.
    if (key === 'color') return
    if ((key === 'w' || key === 'h') && (node.rtt !== true || node.rttGroupId !== null)) return
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
    if (evt === 'loaded' || evt === 'textCalculated') {
      let listeners = resourceListeners.get(node)
      if (listeners === undefined) {
        listeners = new Set()
        resourceListeners.set(node, listeners)
      }
      const listener = { cb, unsub: null, active: true, revision: 0 }
      listeners.add(listener)
      bindResourceListener(node, listener)
      return () => {
        listener.active = false
        if (listener.unsub !== null) listener.unsub()
        listeners.delete(listener)
      }
    }
    if (evt === 'failed') {
      const sig = node.signals?.failed
      if (sig !== undefined && sig !== null) return subscribeSignal(sig, (err) => cb(err, node))
      return () => {}
    }
    if (evt === 'inBounds' || evt === 'outOfBounds' || evt === 'inViewport') {
      // FTL does not yet distinguish preload bounds from the strict viewport.
      const name = evt === 'inViewport' ? 'inBounds' : evt
      return subscribeSignal(node.signals[name], () =>
        cb(node, {
          previous: name === 'outOfBounds' ? 1 : 0,
          current: name === 'outOfBounds' ? 0 : 1,
        })
      )
    }
    throw new Error(`[Blits:FTL] unsupported event '${evt}'`)
  },
  off(unsub) {
    // FTL `subscribe` returns an unsubscribe fn; adapter `on` returns it, so
    // `off` just invokes it. Kept as a named method for interface parity.
    if (typeof unsub === 'function') unsub()
  },
  destroy(node) {
    const listeners = resourceListeners.get(node)
    if (listeners !== undefined) {
      for (const listener of listeners) {
        listener.active = false
        if (listener.unsub !== null) listener.unsub()
      }
      resourceListeners.delete(node)
    }
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
