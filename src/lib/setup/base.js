/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import { renderer } from '../../launch.js'
import Focus from '../../focus.js'
import { to } from '../../router.js'
import Image from '../../components/Image.js'
import Circle from '../../components/Circle.js'
import RouterView from '../../components/RouterView.js'
import Sprite from '../../components/Sprite.js'
import Text from '../../components/Text.js'
import eventListeners from '../eventListeners.js'
import { default as log, Log } from '../log.js'

export default (component) => {
  Object.defineProperties(component.prototype, {
    focus: {
      value: function (e) {
        Focus.set(this, e)
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    unfocus: {
      value: function () {
        this.lifecycle.state = 'unfocus'
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    destroy: {
      value: function () {
        this.lifecycle.state = 'destroy'
        for (let i = 0; i < this.___timeouts.length; i++) {
          clearTimeout(this.___timeouts[i])
        }
        for (let i = 0; i < this.___intervals.length; i++) {
          clearInterval(this.___intervals[i])
        }
        eventListeners.removeListeners(this)
        deleteChildren(this.___children)
        Log.debug(`Destroyed component ${this.componentId}`)
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    select: {
      value: function (id) {
        let selected = null
        this.___children.forEach((child) => {
          if (Array.isArray(child)) {
            child.forEach((c) => {
              if (c['id'] === id) selected = c
            })
          } else {
            if (child['id'] === id) selected = child
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
        return renderer.makeShader('RoundedRectangle', args)
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $router: {
      value: {
        to,
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ___components: {
      value: {
        Image: Image(),
        Circle: Circle(),
        RouterView: RouterView(),
        Sprite: Sprite(),
        Text: Text(),
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    ___timeouts: {
      value: [],
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $setTimeout: {
      value: function (fn, ms, ...params) {
        const timeoutId = setTimeout(
          () => {
            this.____timeouts = this.___timeouts.filter((id) => id !== timeoutId)
            fn.apply(null, params)
          },
          ms,
          params
        )
        this.___timeouts.push(timeoutId)
        return timeoutId
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ___intervals: {
      value: [],
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $setInterval: {
      value: function (fn, ms, ...params) {
        const intervalId = setInterval(
          () => {
            this.____intervals = this.___intervals.filter((id) => id !== intervalId)
            fn.apply(null, params)
          },
          ms,
          params
        )
        this.___intervals.push(intervalId)
        return intervalId
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
    ___renderer: {
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
  })
}

const deleteChildren = function (children) {
  for (let i = 0; i < children.length; i++) {
    if (!children[i]) return
    if (Array.isArray(children[i])) {
      deleteChildren(children[i])
    } else if (children[i].delete) {
      children[i].delete()
    } else if (children[i].destroy) {
      children[i].destroy()
      children[i] = null
    }
    children[i] = null
  }

  children = []
}
