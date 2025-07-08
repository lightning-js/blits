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

import symbols from '../../lib/symbols.js'
import Focus from '../../focus.js'
import eventListeners from '../../lib/eventListeners.js'
import { trigger } from '../../lib/reactivity/effect.js'
import { Log } from '../../lib/log.js'
import { removeGlobalEffects } from '../../lib/reactivity/effect.js'

export default {
  focus: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (e) {
      Log.warn('this.focus is deprecated, use this.$focus instead')
      return this.$focus(e)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $focus: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (e) {
      if (this.eol === true) return
      this[symbols.state].hasFocus = true
      Focus.set(this, e)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  unfocus: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function () {
      this[symbols.state].hasFocus = false
      this.lifecycle.state = 'unfocus'
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  destroy: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function () {
      this.eol = true
      this.lifecycle.state = 'destroy'

      for (let key in this[symbols.state]) {
        if (Array.isArray(this[symbols.state][key])) {
          this[symbols.state][key] = []
        }
      }

      this.$clearTimeouts()
      this.$clearIntervals()
      eventListeners.removeListeners(this)
      deleteChildren(this[symbols.children])
      this[symbols.children].length = 0
      removeGlobalEffects(this[symbols.effects])

      this[symbols.state] = {}

      this[symbols.props] = {}
      this[symbols.computed] = null
      this.lifecycle = {}
      this[symbols.effects].length = 0
      this.parent = null
      this.rootParent = null
      this[symbols.wrapper] = null
      this[symbols.originalState] = null
      this[symbols.slots].length = 0

      delete this[symbols.computed]
      delete this[symbols.effects]
      delete this.parent
      delete this.rootParent
      delete this[symbols.wrapper]
      delete this[symbols.originalState]
      delete this[symbols.children]
      delete this[symbols.slots]
      delete this.componentId
      delete this[symbols.id]
      delete this.ref
      delete this[symbols.state].hasFocus

      this[symbols.holder].destroy()
      this[symbols.holder] = null
      delete this[symbols.holder]

      this[symbols.cleanup]()
      delete this[symbols.cleanup]

      Log.debug(`Destroyed component ${this.componentId}`)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  [symbols.removeGlobalEffects]: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (effects = []) {
      removeGlobalEffects(effects)
    },
    writable: false,
    enumerable: false,
    configurable: false,
  },
  select: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (ref) {
      Log.warn('this.select is deprecated, use this.$select instead')
      return this.$select(ref)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $select: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (ref) {
      let selected = null
      this[symbols.children].forEach((child) => {
        if (Array.isArray(child)) {
          child.forEach((c) => {
            if (c['ref'] === ref) selected = c
          })
        } else if (Object.getPrototypeOf(child) === Object.prototype) {
          Object.keys(child).forEach((k) => {
            if (child[k]['ref'] === ref) selected = child[k]
          })
        } else {
          if (child['ref'] === ref) selected = child
        }
      })
      return selected
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  trigger: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (key) {
      Log.warn('this.trigger is deprecated, use this.$trigger instead')
      return this.$trigger(key)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $trigger: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (key) {
      let target = this[symbols.originalState]
      // when dot notation used, find the nested target
      if (key.indexOf('.') > -1) {
        const keys = key.split('.')
        key = keys.pop(keys)
        for (let i = 0; i < keys.length; i++) {
          target = target[keys[i]]
        }
      }
      // trigger with force set to true
      trigger(target, key, true)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  shader: {
    /**
     * @this {import('../../component').BlitsComponent}
     */
    value: function (type, args) {
      return {
        type: type,
        props: args,
      }
      // const shaders = renderer.driver.stage.shManager.getRegisteredEffects()

      // if (target in shaders) {
      //   return {
      //     type: target,
      //     props: args,
      //   }
      // } else {
      //   Log.error(`Shader ${type} not found`)
      // }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}

/**
 * Recursively destroys all BlitsComponent children.
 * @param {import('../../component').BlitsComponent[]} children
 */
const deleteChildren = function (children) {
  for (let i = 0; i < children.length; i++) {
    if (!children[i]) return
    // call destroy when method is available on child
    if (children[i].destroy && typeof children[i].destroy === 'function') {
      children[i].destroy()
    }
    // recursively call deleteChildren when it's an object of items (happens when using a forloop construct)
    else if (Object.getPrototypeOf(children[i]) === Object.prototype) {
      deleteChildren(Object.values(children[i]))
    }

    children[i] = null
  }

  children.length = 0
}
