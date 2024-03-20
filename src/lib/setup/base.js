/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

import { renderer } from '../../launch.js'
import Focus from '../../focus.js'
import { to, currentRoute, navigating, back } from '../../router/router.js'
import Image from '../../components/Image.js'
import Circle from '../../components/Circle.js'
import RouterView from '../../components/RouterView.js'
import Sprite from '../../components/Sprite.js'
import Text from '../../components/Text.js'
import FPScounter from '../../components/FPScounter.js'
import eventListeners from '../eventListeners.js'
import { default as log, Log } from '../log.js'
import symbols from '../symbols.js'

import { trigger } from '../reactivity/effect.js'
import Announcer from '../../announcer/announcer.js'

const shaderAlias = {
  rounded: 'radius',
}

export default (component, name, identifier) => {
  Object.defineProperties(component.prototype, {
    name: {
      value: name,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [symbols.identifier]: {
      value: component[symbols.identifier],
      writable: false,
      enumerable: false,
      configurable: false,
    },
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
    shader: {
      value: function (type, args) {
        const target = shaderAlias[type] || type
        const effects = renderer.driver.stage.shManager.getRegisteredEffects()
        const shaders = renderer.driver.stage.shManager.getRegisteredShaders()
        if (target in effects || target in shaders) {
          return {
            type: target,
            props: args,
          }
        } else {
          Log.error(`Shader ${type} not found`)
        }
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $router: {
      value: {
        to,
        back,
        get currentRoute() {
          return currentRoute
        },
        get routes() {
          return component.prototype[symbols.routes]
        },
        get navigating() {
          return navigating
        },
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [symbols.components]: {
      value: {
        Image: Image(),
        Circle: Circle(),
        RouterView: RouterView(),
        Sprite: Sprite(),
        Text: Text(),
        FPScounter: FPScounter(),
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $setTimeout: {
      value: function (fn, ms, ...params) {
        const timeoutId = setTimeout(
          () => {
            this[symbols.timeouts] = this[symbols.timeouts].filter((id) => id !== timeoutId)
            fn.apply(null, params)
          },
          ms,
          params
        )
        this[symbols.timeouts].push(timeoutId)
        return timeoutId
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $clearTimeout: {
      value: function (timeoutId) {
        if (this[symbols.timeouts].indexOf(timeoutId) > -1) {
          this[symbols.timeouts] = this[symbols.timeouts].filter((id) => id !== timeoutId)
          clearTimeout(timeoutId)
        }
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $clearTimeouts: {
      value: function () {
        for (let i = 0; i < this[symbols.timeouts].length; i++) {
          clearTimeout(this[symbols.timeouts][i])
        }
        this[symbols.timeouts] = []
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $setInterval: {
      value: function (fn, ms, ...params) {
        const intervalId = setInterval(() => fn.apply(null, params), ms, params)
        this[symbols.intervals].push(intervalId)
        return intervalId
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $clearInterval: {
      value: function (intervalId) {
        if (this[symbols.intervals].indexOf(intervalId) > -1) {
          this[symbols.intervals] = this[symbols.intervals].filter((id) => id !== intervalId)
          clearInterval(intervalId)
        }
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $clearIntervals: {
      value: function () {
        for (let i = 0; i < this[symbols.intervals].length; i++) {
          clearInterval(this[symbols.intervals][i])
        }
        this[symbols.intervals] = []
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $emit: {
      value: function (event, params) {
        eventListeners.executeListeners(event, params)
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    $listen: {
      value: function (event, callback) {
        eventListeners.registerListener(this, event, callback)
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    [symbols.renderer]: {
      value: renderer,
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $log: {
      value: log('App'),
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $trigger: {
      value: function (key) {
        // trigger with force set to true
        trigger(this[symbols.originalState], key, true)
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $announcer: {
      value: Announcer,
      writable: false,
      enumerable: false,
      configurable: false,
    },
  })
}

const deleteChildren = function (children) {
  // for (let i = 0; i < children.length; i++) {
  //   if (!children[i]) return
  //   if (Array.isArray(children[i])) {
  //     deleteChildren(children[i])
  //   } else if (children[i].destroy) {
  //     children[i].destroy()
  //   }
  //   children[i] = null
  // }

  children.length = 0
}
