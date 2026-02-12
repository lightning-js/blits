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

import { Log } from './log.js'
import { emit, privateEmit } from './hooks.js'
import symbols from './symbols.js'
import Settings from '../settings.js'

let inspectorEnabled = null

/**
 * List of valid lifecycle states for a component.
 * @type {Array<string>}
 */
const states = [
  'init', // fired upon component instantiation
  'ready', // fired when component instantiated, reactivity setup done and template spawned
  'focus', // fired when receiving focus (can occur multiple times)
  'unfocus', // fired when losing focus (can occur multiple times)
  'destroy', // fired when component is destroyed and removed
  'attach', // fired when entering the viewport margin and attached to the render tree
  'detach', // fired when leaving the viewport margin and detached from the render tree
  'enter', // fired when entering the visible viewport
  'exit', // fired when leaving the visible viewport
]

/**
 * Lifecycle state manager for components.
 *
 * @typedef {Object} Lifecycle
 * @property {string|null} previous - The previous lifecycle state.
 * @property {string|null} current - The current lifecycle state.
 * @property {Object} [component] - The component instance this lifecycle belongs to.
 * @property {string|null} state - The current lifecycle state (getter/setter).
 */

/**
 * Lifecycle state management object for components.
 * Handles state transitions and emits corresponding hooks.
 *
 * @type {Lifecycle}
 * @this {Lifecycle & {component: Object}}
 * The 'component' property is expected to be set by the component instance at runtime.
 */
export default {
  previous: null,
  current: null,
  /**
   * Gets the current lifecycle state.
   * @this {Lifecycle & {component: Object}}
   * @returns {string|null}
   */
  get state() {
    return this.current
  },
  /**
   * Sets the lifecycle state and emits hooks if the state is valid and changed.
   * @this {Lifecycle & {component: Object}}
   * @param {string} v - The new lifecycle state.
   */
  set state(v) {
    if ((states.indexOf(v) > -1 && v !== this.current) || v === 'refocus') {
      Log.debug(
        `Setting lifecycle state from ${this.current} to ${v} for ${this.component.componentId}`
      )
      this.previous = this.current
      this.current = v
      if (v === 'refocus') return
      // emit 'private' hook
      privateEmit(v, this.component[symbols.identifier], this.component)
      // emit 'public' hook
      emit(v, this.component[symbols.identifier], this.component)
      // update the built-in hasFocus state variable
      if (v === 'focus' || v === 'unfocus') {
        if (inspectorEnabled === null) {
          inspectorEnabled = Settings.get('inspector', false)
        }
      }
      if (v === 'focus') {
        this.component[symbols.state].hasFocus = true
        if (
          inspectorEnabled === true &&
          this.component[symbols.holder] &&
          typeof this.component[symbols.holder].setInspectorMetadata === 'function'
        ) {
          this.component[symbols.holder].setInspectorMetadata({ 'blits-hasFocus': true })
        }
      }
      if (v === 'unfocus') {
        this.component[symbols.state].hasFocus = false
        if (
          inspectorEnabled === true &&
          this.component[symbols.holder] &&
          typeof this.component[symbols.holder].setInspectorMetadata === 'function'
        ) {
          this.component[symbols.holder].setInspectorMetadata({ 'blits-hasFocus': false })
        }
      }
    }
  },
}
