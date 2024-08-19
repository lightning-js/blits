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

export default {
  focus: {
    value: function (e) {
      this[symbols.state].hasFocus = true
      Focus.set(this, e)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  unfocus: {
    value: function () {
      this[symbols.state].hasFocus = false
      this.lifecycle.state = 'unfocus'
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  destroy: {
    value: function () {
      this.lifecycle.state = 'destroy'
      this.$clearTimeouts()
      this.$clearIntervals()
      eventListeners.removeListeners(this)
      deleteChildren(this[symbols.children])
      Log.debug(`Destroyed component ${this.componentId}`)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  select: {
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
    value: function (key) {
      // trigger with force set to true
      trigger(this[symbols.originalState], key, true)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  $trigger: {
    value: function (key) {
      Log.warn('this.$trigger is deprecated, use this.trigger instead')
      return this.trigger(key)
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
  shader: {
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
