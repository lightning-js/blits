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

/**
 * NodeAdapter — the layer between BlitsElement and FTL elements.
 *
 * The element layer transforms template attributes. This adapter creates and
 * invalidates FTL elements and normalizes resource/lifecycle subscriptions.
 *
 * FTL elements use explicit dirty tracking, signal-based events, RGBA float
 * colors, and separate text/texture objects. Transitions use the optional
 * AnimeJS bridge; shader/font/texture setup lives in the dedicated bridges.
 *
 * @typedef {object} AnimationSettings
 * @property {number} [duration] - Duration in ms.
 * @property {string} [easing] - Easing name.
 * @property {number} [delay] - Delay in ms.
 *
 * @typedef {object} AnimationController
 * @property {function(): void} start
 * @property {function(boolean=): void} stop - `stop(true)` finishes early
 *   (end callbacks run); `stop(false)` cancels (end callbacks skipped).
 * @property {string} state - 'scheduled' | 'running' | 'stopped'
 * @property {function(string, function): void} once - 'animating' | 'stopped'
 * @property {function(string, function): void} on - 'tick', payload `(node, {progress})`
 *
 * @typedef {object} LoadedPayload
 * @property {number} w
 * @property {number} h
 * @property {string} [type]
 *
 * @typedef {object} NodeAdapter
 * @property {() => any} getRoot - Root node of the stage (`renderer.root` / `app.root`).
 * @property {(props: object) => any} createNode - Create a non-text node.
 * @property {(props: object) => any} createTextNode - Create a text node.
 * @property {(node: any, key: string, value: any) => void} setProp - Assign one
 *   (already transformed) prop. FTL impl must call `dirty()` internally.
 * @property {(node: any, key: string, from: any, to: any, settings: AnimationSettings, write: (value: any) => void) => AnimationController} animate - Tween one
 *   transformed prop from `from` to `to`. `write` persists eased values
 *   (element-layer routing for text/color).
 * @property {(node: any, evt: string, cb: function) => void} on - Events:
 *   'loaded' | 'failed' | 'textCalculated' | 'inBounds' | 'outOfBounds' | 'inViewport'.
 * @property {(node: any, evt?: string, cb?: function) => void} off
 * @property {(node: any) => void} destroy
 * @property {(node: any) => any} getParent
 * @property {(node: any) => any[]} getChildren
 * @property {(node: any) => number|string} getId
 * @property {(type: string, props?: object) => any} createShader - Use the shader bridge instead.
 * @property {(type: string, props?: object) => any} createTexture - Use the texture/sprite bridge instead.
 * @property {(...args: any[]) => Promise<void>} loadFont - Use launch font registration instead.
 */

/**
 * Throw a loud, greppable error for operations outside this adapter.
 * @param {string} feature - e.g. 'shaders', 'animate', 'loadFont'
 */
export const unsupported = (feature) => {
  throw new Error(`[Blits:NodeAdapter] '${feature}' is not exposed by the node adapter`)
}

/**
 * Validate that an object implements the NodeAdapter surface. Used in tests
 * and at engine boot so a half-implemented adapter fails fast.
 * @param {any} adapter
 * @returns {void}
 */
export const assertNodeAdapter = (adapter) => {
  const required = [
    'getRoot',
    'createNode',
    'createTextNode',
    'setProp',
    'animate',
    'on',
    'off',
    'destroy',
    'getParent',
    'getChildren',
    'getId',
  ]
  for (let i = 0; i < required.length; i++) {
    if (typeof adapter[required[i]] !== 'function') {
      throw new Error(`[Blits:NodeAdapter] adapter is missing required method '${required[i]}'`)
    }
  }
}
