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

// L3 NodeAdapter: thin wrapper over the RendererMain singleton owned by
// ./launch.js. No prop transformation happens here — that stays in
// element.js `propsTransformer`. This file exists so Blits core can be
// migrated call-by-call from `renderer.createNode` / `node[x] =` to
// `adapter.createNode` / `adapter.setProp` without behavior change.
//
// Migration status: new code should use this adapter; element.js still calls
// the singleton directly (see TODO.md phase 0). Each method below maps 1:1 to
// the current direct call so the refactor is mechanical.

import { renderer } from './launch.js'

/**
 * Normalize L3 loaded/failed event payloads to the adapter shape.
 * L3 `loaded` handler: `(el, { type, dimensions })`.
 * Adapter contract: `cb({ w, h, type })`.
 */
const normalizeLoaded =
  (cb) =>
  (el, { type, dimensions } = {}) =>
    cb({ w: dimensions && dimensions.w, h: dimensions && dimensions.h, type }, el)

export default {
  getRoot() {
    return renderer.root
  },
  createNode(props) {
    return renderer.createNode(props)
  },
  createTextNode(props) {
    return renderer.createTextNode(props)
  },
  setProp(node, key, value) {
    node[key] = value
  },
  animate(node, props, settings) {
    return node.animate(props, settings)
  },
  on(node, evt, cb) {
    if (evt === 'loaded') {
      node.on(evt, normalizeLoaded(cb))
      return
    }
    node.on(evt, cb)
  },
  off(node, evt, cb) {
    // element.js destroy paths call renderer.off() globally in some places;
    // per-node off is the adapter contract.
    if (typeof node.off === 'function') node.off(evt, cb)
  },
  destroy(node) {
    node.destroy()
  },
  getParent(node) {
    return node && node.parent
  },
  getChildren(node) {
    return (node && node.children) || []
  },
  getId(node) {
    return node && node.id
  },
  createShader(type, props) {
    return renderer.createShader(type, props)
  },
  createTexture(type, props) {
    return renderer.createTexture(type, props)
  },
  loadFont(...args) {
    return renderer.stage.loadFont(...args)
  },
}
