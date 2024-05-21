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
import colors from '../../lib/colors/colors.js'

import { Log } from '../../lib/log.js'
import symbols from '../../lib/symbols.js'
import Settings from '../../settings.js'

const deprecationMsg = `
----------------------------------------------------------------------------------------------------
Deprecation notice:
----------------------------------------------------------------------------------------------------

The property for defining a transition easing function has been renamed from "function" to "easing".

Please update your code like the example below to keep your custom easing function.

Before: <Element :y.transition=“{v: $y, function: ‘ease-in-out’}” />

After: <Element :y.transition=“{v: $y, easing: ‘ease-in-out’}” />

`

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
  if (typeof v !== 'string') {
    return v
  } else if (v.indexOf('%') === v.length - 1) {
    return this.element.node._parent[base] * (parseFloat(v) / 100)
  }
  return v
}

const unpackTransition = (v) => {
  if (typeof v === 'string') return v
  else if (typeof v === 'number') return v
  else if (typeof v === 'object' && v.constructor === Object) {
    if ('value' in v) {
      return v.value
    } else if ('transition' in v) {
      return unpackTransition(v.transition)
    }
  }
  return v
}

const colorMap = {
  top: 'colorTop',
  bottom: 'colorBottom',
  left: 'colorLeft',
  right: 'colorRight',
}

let textDefaults

const propsTransformer = {
  set parent(v) {
    this.props['parent'] = v === 'root' ? renderer.root : v.node
  },
  set rotation(v) {
    this.props['rotation'] = v * (Math.PI / 180)
  },
  set w(v) {
    this.props['width'] = typeof v !== 'string' ? v : parsePercentage.call(this, v, 'width')
  },
  set width(v) {
    this.props['width'] = parsePercentage.call(this, v, 'width')
  },
  set h(v) {
    this.props['height'] = parsePercentage.call(this, v, 'height')
  },
  set height(v) {
    this.props['height'] = parsePercentage.call(this, v, 'height')
  },
  set x(v) {
    this.props['x'] = parsePercentage.call(this, v, 'width')
  },
  set y(v) {
    this.props['y'] = parsePercentage.call(this, v, 'height')
  },
  set z(v) {
    this.props['zIndex'] = v
  },
  set zIndex(v) {
    this.props['zIndex'] = v
  },
  set color(v) {
    if (typeof v === 'string' && v.indexOf('{') === -1) {
      this.props['color'] = colors.normalize(v)
    } else if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      this.props['color'] = 0
      Object.entries(v).forEach((color) => {
        this.props[colorMap[color[0]]] = colors.normalize(color[1])
      })
    }
  },
  set src(v) {
    this.props['src'] = v
    if (!this.raw.has('color')) {
      this.props['color'] = 0xffffffff
    }
  },
  set texture(v) {
    this.props['texture'] = v
    if (!this.raw.has('color')) {
      this.props['color'] = 0xffffffff
    }
  },
  set mount(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if ('x' in v) {
        this.props['mountX'] = v.x
      }
      if ('y' in v) {
        this.props['mountY'] = v.y
      }
    } else {
      this.props['mountX'] = v
      this._props['mountY'] = v
    }
  },
  set pivot(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if ('x' in v) {
        this.props['pivotX'] = v.x
      }
      if ('y' in v) {
        this.props['pivotY'] = v.y
      }
    } else {
      this.props['pivotX'] = v
      this.props['pivotY'] = v
    }
  },
  set scale(v) {
    if (typeof v === 'object' || (isObjectString(v) && (v = parseToObject(v)))) {
      if ('x' in v) {
        this.props['scaleX'] = v.x
      }
      if ('y' in v) {
        this.props['scaleY'] = v.y
      }
    } else {
      this.props['scale'] = v
    }
  },
  set show(v) {
    this.props['alpha'] = v ? 1 : 0
  },
  set alpha(v) {
    this.props['alpha'] = v
  },
  set effects(v) {
    this.props['shader'] = renderer.createShader('DynamicShader', {
      effects: v.map((eff) => {
        if (eff.props && eff.props.color) {
          eff.props.color = colors.normalize(eff.props.color)
        }
        return eff
      }),
    })
  },
  set clipping(v) {
    this.props['clipping'] = v
  },
  set overflow(v) {
    this.props['clipping'] = !!!v
  },
  set font(v) {
    this.props['fontFamily'] = v
  },
  set size(v) {
    this.props['fontSize'] = v
  },
  set wordWrap(v) {
    this.props['width'] = v
  },
  set contain(v) {
    this.props['contain'] = v
  },
  set maxLines(v) {
    this.props['maxLines'] = v
  },
  set overflowSuffix(v) {
    this.props['overflowSuffix'] = v === false ? ' ' : v === true ? undefined : v
  },
  set letterSpacing(v) {
    this.props['letterSpacing'] = v || 1
  },
  set lineHeight(v) {
    this.props['lineHeight'] = v
  },
  set textAlign(v) {
    this.props['textAlign'] = v
  },
  set content(v) {
    this.props['text'] = '' + v
    this.props['fontFamily'] = 'lato'
  },
  set rtt(v) {
    this.props['rtt'] = v
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

    const propKeys = Object.keys(props)
    const length = propKeys.length

    this.props.raw = new Map(Object.entries(props))

    for (let i = 0; i < length; i++) {
      const key = propKeys[i]
      const value = props[key]
      if (value !== undefined) {
        this.props[key] = unpackTransition(value)
      }
    }

    // correct for default white nodes (but not for text nodes)
    if (!this.props.props['color'] && !props.__textnode) {
      this.props.props['color'] =
        this.props.props['src'] || this.props.props['texture'] || this.props.props['rtt'] === true
          ? 0xffffffff
          : 0
    }

    this.node = props.__textnode
      ? renderer.createTextNode({ ...textDefaults, ...this.props.props })
      : (this.node = renderer.createNode(this.props.props))

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
    if (value === undefined) return
    if (this.props.raw.get(prop) === value) return
    const propsSet = new Set(this.props._set)

    this.props.props = {}
    this.props[prop] = unpackTransition(value)

    const props = Object.entries(this.props.props)

    if (props.length === 1) {
      const [p, v] = props[0]
      if (isTransition(value) && propsSet.has(p)) {
        return this.animate(p, v, value.transition)
      } else if (this.node[p] !== v) {
        this.node[p] = v
      }
    } else {
      for (let i = 0; i < props.length; i++) {
        // todo: fix code duplication
        const [p, v] = props[0]
        if (isTransition(value) && propsSet.has(p)) {
          return this.animate(p, v, value.transition)
        } else if (this.node[p] !== v) {
          this.node[p] = v
        }
      }
    }
  },
  async animate(prop, value, transition) {
    // if current value is the same as the value to animate to, instantly resolve
    if (this.node[prop] === value) return Promise.resolve()
    // check if a transition is already scheduled or running on the same prop
    if (this.scheduledTransitions[prop]) {
      if (this.scheduledTransitions[prop].f.state === 'running') {
        this.scheduledTransitions[prop].f.stop()
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
            ? Log.warn(deprecationMsg)
            : 'easing' in transition
            ? transition.easing
            : 'ease'
          : 'ease',
      delay: typeof transition === 'object' ? ('delay' in transition ? transition.delay : 0) : 0,
    })

    // capture the current value to be used in the transition start
    const startValue = this.node[prop]

    // schedule the transition for this prop, so it can be canceled /
    // removed if another transition for the same prop starts in the mean time
    this.scheduledTransitions[prop] = {
      v: props[prop],
      cancel: false,
      f,
    }

    // wait until the animation really starts (depending on specified delay)
    const animation = await f.start().waitUntilStarted()

    // fire transition start callback if specified
    transition.start &&
      typeof transition.start === 'function' &&
      transition.start.call(this.component, this, prop, startValue)

    // wait until the animation ends
    const finished = await animation.waitUntilStopped()

    // removed the prop from scheduled transitions
    delete this.scheduledTransitions[prop]

    // fire transition end callback if specified
    transition.end &&
      typeof transition.end === 'function' &&
      transition.end.call(this.component, this, prop, this.node[prop])

    return Promise.resolve()
  },
  destroy() {
    Log.debug('Deleting  Node', this.nodeId)
    Object.values(this.scheduledTransitions).forEach((scheduledTransition) => {
      clearTimeout(scheduledTransition.timeout)
    })
    this.node.destroy()
  },
  get nodeId() {
    return this.node && this.node.id
  },
  get ref() {
    return this.initData.ref || null
  },
}

export default (config, component) => {
  if (!textDefaults) {
    textDefaults = { fontSize: 32, fontFamily: Settings.get('defaultFont', 'lato') }
  }
  return Object.assign(Object.create(Element), {
    props: Object.assign(Object.create(propsTransformer), { props: {} }),
    node: null,
    scheduledTransitions: {},
    initData: {},
    config,
    component,
  })
}
