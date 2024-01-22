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

import { renderer } from './launch.js'
import colors from './lib/colors/colors.js'

import { Log } from './lib/log.js'
import symbols from './lib/symbols.js'

const isTransition = (value) => {
  return typeof value === 'object' && 'transition' in value
}

const isObjectString = (str) => {
  return typeof str === 'string' && str.startsWith('{') && str.endsWith('}')
}

const parseToObject = (str) => {
  return JSON.parse(str.replace(/'/g, '"').replace(/([\w-_]+)\s*:/g, '"$1":'))
}

const parsePercentage = function (v, base) {
  if (typeof v === 'string' && v.endsWith('%')) {
    return this.element.node._parent[base] * (parseFloat(v) / 100)
  }
  return v
}

const unpackTransition = (obj) => {
  if (typeof obj === 'object' && obj.constructor === Object) {
    if ('value' in obj) {
      return obj.value
    } else if ('transition' in obj) {
      return unpackTransition(obj.transition)
    }
  }
  return obj
}

let firstNode = false

const Props = {
  set parent(v) {
    this._props.parent = v === 'root' ? renderer.root : v.node
    this._set.add('parent')
  },
  set rotation(v) {
    this._props.rotation = v * (Math.PI / 180)
    this._set.add('rotation')
  },
  set w(v) {
    this._props.width = parsePercentage.call(this, v, 'width')
    this._set.add('width')
  },
  set width(v) {
    this._props.width = parsePercentage.call(this, v, 'width')
    this._set.add('width')
  },
  set h(v) {
    this._props.height = parsePercentage.call(this, v, 'height')
    this._set.add('height')
  },
  set height(v) {
    this._props.height = parsePercentage.call(this, v, 'height')
    this._set.add('height')
  },
  set x(v) {
    this._props.x = parsePercentage.call(this, v, 'width')
    this._set.add('x')
  },
  set y(v) {
    this._props.y = parsePercentage.call(this, v, 'height')
    this._set.add('y')
  },
  set z(v) {
    this._props.zIndex = v
    this._set.add('zIndex')
  },
  set zIndex(v) {
    this._props.zIndex = v
    this._set.add('zIndex')
  },
  set color(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      const map = {
        top: 'colorTop',
        bottom: 'colorBottom',
        left: 'colorLeft',
        right: 'colorRight',
      }
      this._props.color = 0
      Object.entries(v).forEach((color) => {
        this._props[map[color[0]]] = colors.normalize(color[1])
        this._set.add(map[color[0]])
      })
    } else {
      this._props.color = colors.normalize(v)
    }
    this._set.add('color')
  },
  set src(v) {
    this._props.src = v
    if (!this._set.has('color')) {
      this._props.color = 0xffffffff
    }
    this._set.add('src')
  },
  set texture(v) {
    this._props.texture = v
    if (!this._set.has('color')) {
      this._props.color = 0xffffffff
    }
    this._set.add('texture')
  },
  set mount(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if (v.x) {
        this._props.mountX = v.x
        this._set.add('mountX')
      }
      if (v.y) {
        this._props.mountY = v.y
        this._set.add('mountY')
      }
    } else {
      this._props.mountX = this._props.mountY = v
      this._set.add('mountX')
      this._set.add('mountY')
    }
  },
  set pivot(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if (v.x) {
        this._set.add('pivotX')
        this._props.pivotX = v.x
      }
      if (v.y) {
        this._set.add('pivotY')
        this._props.pivotY = v.y
      }
    } else {
      this._props.pivotX = this._props.pivotY = v
      this._set.add('pivotX')
      this._set.add('pivotY')
    }
  },
  set scale(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if (v.x) this._props.scaleX = v.x
      if (v.y) this._props.scaleY = v.y
    } else {
      this._props.scale = v
    }
    this._set.add('scale')
  },
  set show(v) {
    this._props.alpha = v ? 1 : 0
  },
  set alpha(v) {
    this._props.alpha = v
    this._set.add('alpha')
  },
  set text(v) {
    this._props.text = v !== undefined ? v.toString() : ''
  },
  set effects(v) {
    this._props.shader = renderer.createShader('DynamicShader', {
      effects: v.map((eff) => {
        if (eff.props && eff.props.color) {
          eff.props.color = colors.normalize(eff.props.color)
        }
        return eff
      }),
    })
    this._set.add('effects')
  },
  set fontFamily(v) {
    this._props.fontFamily = v
  },
  set fontSize(v) {
    this._props.fontSize = v
  },
  set wordWrap(v) {
    this._props.width = v
  },
  set contain(v) {
    this._props.contain = v
  },
  set maxLines(v) {
    this.height = v * this.element.node.fontSize
  },
  set letterSpacing(v) {
    this._props.letterSpacing = v
  },
  set textAlign(v) {
    this._props.textAlign = v
  },
}

const Element = {
  defaults: {},
  populate(data) {
    const props = {
      ...this.defaults,
      ...this.config,
      ...data,
    }

    this.initData = data

    if (props[symbols.isSlot]) {
      this[symbols.isSlot] = true
    }

    this.props.element = this

    for (const [prop, value] of Object.entries(props)) {
      const descriptor = Object.getOwnPropertyDescriptor(Props, prop)
      if (descriptor && descriptor.set) {
        this.props[prop] = unpackTransition(value)
      }
    }

    // correct for default white nodes
    if (!this.props._set.has('color')) {
      this.props._props.color =
        this.props._set.has('src') || this.props._set.has('texture') ? 0xffffffff : 0
    }

    // temporary workaround for renderer issue https://github.com/lightning-js/renderer/issues/123
    if (!firstNode) {
      this.props._props.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
      firstNode = true
    }

    this.node = props.__textnode
      ? renderer.createTextNode(this.props._props)
      : renderer.createNode(this.props._props)

    if (props['@loaded']) {
      this.node.on('loaded', (el, { type, dimensions }) => {
        props['@loaded']({ w: dimensions.width, h: dimensions.height, type }, this)
      })
    }

    if (props['@error']) {
      this.node.on('failed', (el, error) => {
        props['@error'](error, this)
      })
    }
  },
  set(prop, value) {
    const propsSet = new Set(this.props._set)

    this.props._props = {}
    this.props[prop] = unpackTransition(value)

    for (const [p, v] of Object.entries(this.props._props)) {
      if (isTransition(value) && propsSet.has(p)) {
        return this.animate(p, v, value.transition)
      } else {
        this.node[p] = v
      }
    }
  },
  animate(prop, value, transition) {
    if (this.node[prop] === value) return Promise.resolve()
    // check if a transition is already schedule or running on the same prop
    if (this.scheduledTransitions[prop]) {
      // clearTimeout(this.scheduledTransitions[prop].timeout)
      if (this.scheduledTransitions[prop].f.state === 'running') {
        this.scheduledTransitions[prop].f.pause()
        // fastforward to final value
        this.node[prop] = this.scheduledTransitions[prop].v
      }
    }

    const props = {}
    props[prop] = value

    // construct animate function
    const f = this.node.animate(props, {
      duration:
        typeof transition === 'object'
          ? 'duration' in transition
            ? transition.duration
            : 300
          : 300,
      easing:
        typeof transition === 'object'
          ? 'function' in transition
            ? transition.function
            : 'ease'
          : 'ease',
    })

    // schedule transition
    return new Promise((resolve) => {
      this.scheduledTransitions[prop] = {
        v: props[prop],
        f,
        timeout: setTimeout(() => {
          // fire transition start callback if specified
          transition.start &&
            typeof transition.start === 'function' &&
            transition.start.call(this.component, this, prop, props[prop])

          // start the animation
          try {
            f.start()
              .waitUntilStopped()
              .then(() => delete this.scheduledTransitions[prop])
              .then(() => {
                // fire transition end callback if specified
                transition.end &&
                  typeof transition.end === 'function' &&
                  transition.end.call(this.component, this, prop, this.node[prop])
              })
              .then(resolve)
          } catch (e) {
            Log.error(e)
          }
        }, transition.delay || 0),
      }
    })
  },
  delete() {
    Log.debug('Deleting  Node', this.nodeId)
    Object.values(this.scheduledTransitions).forEach((scheduledTransition) => {
      clearTimeout(scheduledTransition.timeout)
    })
    this.node.parent = null
  },
  get nodeId() {
    return this.node && this.node.id
  },
  get ref() {
    return this.initData.ref || null
  },
}

export default (config, component) =>
  Object.assign(Object.create(Element), {
    props: Object.assign(Object.create(Props), { _props: {}, _set: new Set() }),
    node: null,
    scheduledTransitions: {},
    initData: {},
    config,
    component,
  })
