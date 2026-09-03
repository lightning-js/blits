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
 * NodeAdapter — the layer between Blits CoreNodes (BlitsElement) and the
 * underlying renderer primitives (L3 CoreNode/CoreTextNode vs FTL Element).
 *
 * Blits core (`src/engines/L3/element.js` today, `src/engines/FTL/element.js`
 * tomorrow) must ONLY talk to a renderer through this interface. It must never
 * import `RendererMain`, FTL `createElement`, or touch `node._dirty`-style
 * internals directly.
 *
 * Key semantic differences the adapter normalizes:
 * - L3 CoreNode: reactive setters (assign + done), `node.animate()` built in,
 *   `EventEmitter` (`on/off/once`), color as normalized number, `%` strings
 *   resolved by Blits before passing.
 * - FTL Element: plain struct, caller MUST call `el.dirty()` after mutation
 *   (`setProp` does this), no built-in animate (stubbed in phase 1), `signal()`
 *   based events, color as `[r,g,b,a 0-1]`, `visible` flag, text/image as
 *   separate objects (`el.text` / `el.texture`).
 *
 * Phase 1 scope (core-only): position/size/alpha/color/texture/text/parent/
 * events (loaded/failed). Shaders, sprites, SDF/MSDF fonts, transitions,
 * inspector, RTT and mouse-picking are explicitly out of scope and throw
 * `unsupported()` so call sites fail loudly instead of silently misrendering.
 *
 * @typedef {object} AnimationSettings
 * @property {number} [duration] - Duration in ms.
 * @property {string} [easing] - Easing name.
 * @property {number} [delay] - Delay in ms.
 *
 * @typedef {object} AnimationController
 * @property {function(): void} start
 * @property {function(boolean=): void} stop
 * @property {string} state - 'scheduled' | 'running' | 'stopped'
 * @property {function(string, function): void} once
 * @property {function(string, function): void} on
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
 * @property {(node: any, props: object, settings: AnimationSettings) => AnimationController} animate
 * @property {(node: any, evt: string, cb: function) => void} on - Events:
 *   'loaded' | 'failed' (phase 1) ; 'inBounds' | 'outOfBounds' | 'inViewport' (phase 2).
 * @property {(node: any, evt?: string, cb?: function) => void} off
 * @property {(node: any) => void} destroy
 * @property {(node: any) => any} getParent
 * @property {(node: any) => any[]} getChildren
 * @property {(node: any) => number|string} getId
 * @property {(type: string, props?: object) => any} createShader - Phase 2. Throws in phase 1.
 * @property {(type: string, props?: object) => any} createTexture - Phase 2. Throws in phase 1.
 * @property {(...args: any[]) => Promise<void>} loadFont - Phase 2. Throws in phase 1.
 */

/**
 * Throw a loud, greppable error for phase-1 out-of-scope features.
 * @param {string} feature - e.g. 'shaders', 'animate', 'loadFont'
 */
export const unsupported = (feature) => {
  throw new Error(
    `[Blits:NodeAdapter] '${feature}' is not supported by this renderer yet (phase 1 core-only)`
  )
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
