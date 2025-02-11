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

const createPaddingObject = (padding, direction) => {
  if (padding === undefined) {
    return { start: 0, end: 0, oppositeStart: 0, oppositeEnd: 0 }
  }

  if (typeof padding === 'number') {
    return { start: padding, end: padding, oppositeStart: padding, oppositeEnd: padding }
  }

  // todo: do we need to do this runtime every time? or can we optimize this?
  if (isObjectString(padding) === true) {
    padding = parseToObject(padding)
  }

  if (typeof padding === 'object') {
    const {
      top = undefined,
      right = undefined,
      bottom = undefined,
      left = undefined,
      x = 0,
      y = 0,
    } = padding

    // use specific values if provided, otherwise fall back to x or y
    return direction === 'vertical'
      ? {
          start: top !== undefined ? top : y,
          end: bottom !== undefined ? bottom : y,
          oppositeStart: left !== undefined ? left : x,
          oppositeEnd: right !== undefined ? right : x,
        }
      : {
          start: left !== undefined ? left : x,
          end: right !== undefined ? right : x,
          oppositeStart: top !== undefined ? top : y,
          oppositeEnd: bottom !== undefined ? bottom : y,
        }
  }
  return { start: 0, end: 0, oppositeStart: 0, oppositeEnd: 0 }
}

const layoutFn = function (config) {
  const position = config.direction === 'vertical' ? 'y' : 'x'
  const oppositePosition = config.direction === 'vertical' ? 'x' : 'y'
  const oppositeMount = config.direction === 'vertical' ? 'mountX' : 'mountY'
  const dimension = config.direction === 'vertical' ? 'height' : 'width'
  const oppositeDimension = config.direction === 'vertical' ? 'width' : 'height'
  const padding = createPaddingObject(config.padding, config.direction)

  let offset = padding.start

  const children = this.node.children
  const childrenLength = children.length
  let otherDimension = 0
  const gap = config.gap || 0
  for (let i = 0; i < childrenLength; i++) {
    const node = children[i]
    node[position] = offset
    node[oppositePosition] = padding.oppositeStart
    // todo: temporary text check, due to 1px width of empty text node
    if (dimension === 'width') {
      offset += node.width + (node.width !== ('text' in node ? 1 : 0) ? gap : 0)
    } else {
      offset +=
        'text' in node
          ? node.width > 1
            ? node.height + gap
            : 0
          : node.height !== 0
          ? node.height + gap
          : 0
    }
    otherDimension = Math.max(
      otherDimension,
      node[oppositeDimension] + padding.oppositeStart + padding.oppositeEnd
    )
  }
  // adjust the size of the layout container
  this.node[dimension] = offset - gap + padding.end
  this.node[oppositeDimension] = otherDimension

  const align = {
    start: 0,
    end: 1,
    center: 0.5,
  }[config['align-items'] || 'start']

  if (align !== 0) {
    for (let i = 0; i < childrenLength; i++) {
      const node = children[i]
      node[oppositePosition] = otherDimension
      node[oppositeMount] = align
    }
  }

  // emit an updated event
  if (config['@updated'] !== undefined) {
    config['@updated']({ w: this.node.width, h: this.node.height }, this)
  }
}

const isTransition = (value) => {
  return value !== null && typeof value === 'object' && 'transition' in value === true
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
    return (
      (this.element.config.parent &&
        (this.element.config.parent.node[base] || 0) * (parseFloat(v) / 100)) ||
      0
    )
  }
  return v
}

const unpackTransition = (v) => {
  if (typeof v !== 'object' || v === null) return v
  if (v.constructor === Object) {
    if ('value' in v === true) {
      return v.value
    }
    if ('transition' in v === true) {
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

let textDefaults = null

const AvailableProps = [
  'parent',
  'rotation',
  'w',
  'width',
  'h',
  'height',
  'x',
  'y',
  'z',
  'zIndex',
  'color',
  'style',
  'src',
  'texture',
  'fit',
  'rtt',
  'mount',
  'pivot',
  'scale',
  'show',
  'alpha',
  'shader',
  'effects',
  'clipping',
  'overflow',
  'font',
  'size',
  'wordwrap',
  'maxwidth',
  'maxheight',
  'contain',
  'maxlines',
  'textoverflow',
  'letterspacing',
  'lineheight',
  'align',
  'content',
  'placement',
]

const propsTransformer = {
  set parent(v) {
    this.props['parent'] = v === 'root' ? renderer.root : v.node
  },
  set rotation(v) {
    this.props['rotation'] = v * (Math.PI / 180)
  },
  set w(v) {
    this.props['width'] = parsePercentage.call(this, v, 'width')
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
    if (typeof v === 'string' && v.startsWith('{') === false) {
      this.props['color'] = colors.normalize(v)
    } else if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      this.props['color'] = 0
      Object.entries(v).forEach((color) => {
        this.props[colorMap[color[0]]] = colors.normalize(color[1])
      })
    }
  },
  set src(v) {
    this.props['src'] = v
    if (this.raw['color'] === undefined) {
      this.props['color'] = this.props['src'] ? 0xffffffff : 0x00000000
    }
    // apply auto sizing when no width or height specified
    if (!('w' in this.raw) && !('w' in this.raw) && !('h' in this.raw) && !('height' in this.raw)) {
      this.props['autosize'] = true
    }
  },
  set texture(v) {
    this.props['texture'] = v

    if (this.raw['color'] === undefined && (v === null || v === undefined)) {
      this.props['color'] = 0x00000000
    } else if (this.raw['color'] === undefined) {
      this.props['color'] = 0xffffffff
    }
  },
  set fit(v) {
    const resizeMode = {}

    if (v === 'cover' || v === 'contain') {
      this.props['textureOptions'] = { resizeMode: { type: v } }
      return
    }

    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      resizeMode['type'] = v.type || 'cover'

      if (typeof v.position === 'number') {
        resizeMode['clipY'] = resizeMode['clipX'] = v.position
      }

      if (typeof v.position === 'object') {
        resizeMode['clipX'] = 'x' in v.position === true ? v.position.x : null
        resizeMode['clipY'] = 'y' in v.position === true ? v.position.y : null
      }
      this.props['textureOptions'] = { resizeMode }
    }
  },
  set rtt(v) {
    this.props['rtt'] = v
    if (this.raw['color'] === undefined) {
      this.props['color'] = v === true ? 0xffffffff : 0x00000000
    }
  },
  set mount(v) {
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      if ('x' in v === true) {
        this.props['mountX'] = v.x
      }
      if ('y' in v === true) {
        this.props['mountY'] = v.y
      }
    } else {
      this.props['mountX'] = v
      this.props['mountY'] = v
    }
  },
  set pivot(v) {
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      if ('x' in v === true) {
        this.props['pivotX'] = v.x
      }
      if ('y' in v === true) {
        this.props['pivotY'] = v.y
      }
    } else {
      this.props['pivotX'] = v
      this.props['pivotY'] = v
    }
  },
  set scale(v) {
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      if ('x' in v === true) {
        this.props['scaleX'] = v.x
      }
      if ('y' in v === true) {
        this.props['scaleY'] = v.y
      }
    } else {
      this.props['scale'] = v
    }
  },
  set show(v) {
    if (v) {
      this.props['alpha'] = this.raw['alpha'] !== undefined ? this.raw['alpha'] : 1
      this.props['width'] = this.raw['w'] || this.raw['width'] || 0
      this.props['height'] = this.raw['h'] || this.raw['height'] || 0
    } else {
      this.props['alpha'] = 0
      this.props['width'] = 0
      this.props['height'] = 0
    }
  },
  set alpha(v) {
    if (this.raw['show'] === undefined || this.raw['show'] === true) {
      this.props['alpha'] = v
    }
  },
  set shader(v) {
    if (v !== null) {
      this.props['shader'] = renderer.createShader(v.type, v.props)
    } else {
      this.props['shader'] = renderer.createShader('DefaultShader')
    }
  },
  set effects(v) {
    for (let i = 0; i < v.length; i++) {
      if (v[i].props && v[i].props.color) {
        v[i].props.color = colors.normalize(v[i].props.color)
      }
    }

    if (this.element.node === undefined) {
      this.props['shader'] = renderer.createShader('DynamicShader', {
        effects: v.map((effect) => {
          return renderer.createEffect(effect.type, effect.props, effect.type)
        }),
      })
    } else {
      for (let i = 0; i < v.length; i++) {
        const target = this.element.node.shader.props[v[i].type]
        const props = Object.keys(v[i].props)

        for (let j = 0; j < props.length; j++) {
          target[props[j]] = v[i].props[props[j]]
        }
      }
    }
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
  set wordwrap(v) {
    Log.warn('The wordwrap attribute is deprecated, use maxwidth instead')
    this.props['width'] = v
    this.props['contain'] = 'width'
  },
  set maxwidth(v) {
    this.props['width'] = v
    this.props['contain'] = 'width'
  },
  set maxheight(v) {
    this.props['height'] = v
    this.props['contain'] = 'both'
  },
  set contain(v) {
    this.props['contain'] = v
  },
  set maxlines(v) {
    this.props['maxLines'] = v
  },
  set textoverflow(v) {
    this.props['overflowSuffix'] = v === false ? ' ' : v === true ? undefined : v
  },
  set letterspacing(v) {
    this.props['letterSpacing'] = v || 1
  },
  set lineheight(v) {
    this.props['lineHeight'] = v
  },
  set align(v) {
    this.props['textAlign'] = v
  },
  set content(v) {
    this.props['text'] = '' + v
  },
  set placement(v) {
    let x, y
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      if ('x' in v === true) {
        x = v.x
      }
      if ('y' in v === true) {
        y = v.y
      }
    } else {
      v === 'center' || v === 'right' ? (x = v) : (y = v)
    }

    // Set X position
    if (x === 'center') {
      this.x = '50%'
      this.props['mountX'] = 0.5
    } else if (x === 'right') {
      this.x = '100%'
      this.props['mountX'] = 1
    }

    // Set Y position
    if (y === 'middle') {
      this.y = '50%'
      this.props['mountY'] = 0.5
    } else if (y === 'bottom') {
      this.y = '100%'
      this.props['mountY'] = 1
    }
  },
  set 'inspector-data'(v) {
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      this.props['data'] = v
    }
  },
  set style(v) {
    if (typeof v !== 'object') {
      if (isObjectString(v) === true) {
        v = parseToObject(v)
      } else {
        console.warn('Invalid style format: Expected an object or a valid object-like string.')
        return
      }
    }

    // Apply valid style properties
    Object.entries(v).forEach(([key, value]) => {
      if (AvailableProps.includes(key)) {
        this[key] = value
      } else {
        console.warn(`"${key}" is not a valid style property.`)
      }
    })
  },
}

const Element = {
  populate(data) {
    const props = data
    props['node'] = this.config.node

    if (props[symbols.isSlot] === true) {
      this[symbols.isSlot] = true
    }

    this.props.element = this

    this.props['parent'] = props['parent'] || this.config.parent
    delete props.parent

    this.props.raw = data

    const propKeys = Object.keys(props)
    const length = propKeys.length

    for (let i = 0; i < length; i++) {
      const key = propKeys[i]
      const value = props[key]
      if (value !== undefined) {
        this.props[key] = unpackTransition(value)
      }
    }

    // correct for default white nodes (but not for text nodes)
    if (this.props.props['color'] === undefined && '__textnode' in props === false) {
      this.props.props['color'] = 0
    }

    this.node = props.__textnode
      ? renderer.createTextNode({ ...textDefaults, ...this.props.props })
      : renderer.createNode(this.props.props)

    if (props['@loaded'] !== undefined && typeof props['@loaded'] === 'function') {
      this.node.on('loaded', (el, { type, dimensions }) => {
        props['@loaded']({ w: dimensions.width, h: dimensions.height, type }, this)
      })
    }

    if (props['@error'] !== undefined && typeof props['@error'] === 'function') {
      this.node.on('failed', (el, error) => {
        props['@error'](error, this)
      })
    }

    if (props.__layout === true) {
      this.triggerLayout = layoutFn.bind(this)
    }

    if (this.config.parent.props !== undefined && this.config.parent.props.__layout === true) {
      this.config.parent.triggerLayout(this.config.parent.props)
      this.node.on('loaded', () => {
        this.config.parent.triggerLayout(this.config.parent.props)
      })
    }
  },
  set(prop, value) {
    if (value === undefined) return
    if (this.props.raw[prop] === value) return
    this.props.raw[prop] = value

    this.props.props = {}
    this.props[prop] = unpackTransition(value)

    const propsKeys = Object.keys(this.props.props)

    if (propsKeys.length === 1) {
      if (isTransition(value) === true) {
        return this.animate(propsKeys[0], this.props.props[propsKeys[0]], value.transition)
      }
      // set the prop to the value on the node
      this.node[propsKeys[0]] = this.props.props[propsKeys[0]]
    } else {
      for (let i = 0; i < propsKeys.length; i++) {
        // todo: fix code duplication
        if (isTransition(value) === true) {
          return this.animate(propsKeys[i], this.props.props[propsKeys[i]], value.transition)
        }
        // set the prop to the value on the node
        this.node[propsKeys[i]] = this.props.props[propsKeys[i]]
      }
    }

    if (this.config.parent.props && this.config.parent.props.__layout === true) {
      this.config.parent.triggerLayout(this.config.parent.props)
    }
  },
  animate(prop, value, transition) {
    // check if a transition is already scheduled to run on the same prop
    // and cancels it if it does
    if (
      this.scheduledTransitions[prop] !== undefined &&
      this.scheduledTransitions[prop].f.state === 'scheduled'
    ) {
      this.scheduledTransitions[prop].f.stop()
    }

    // if current value is the same as the value to animate to, instantly resolve
    if (this.node[prop] === value) return

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
          ? 'easing' in transition
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
      f,
    }

    if (transition.start !== undefined && typeof transition.start === 'function') {
      // fire transition start callback when animation really starts (depending on specified delay)
      f.once('animating', () => {
        transition.start.call(this.component, this, prop, startValue)
      })
    }

    if (this.config.parent.props && this.config.parent.props.__layout === true) {
      f.on('tick', () => {
        this.config.parent.triggerLayout(this.config.parent.props)
      })
    }

    if (transition.progress !== undefined && typeof transition.progress === 'function') {
      let prevProgress = 0
      f.on('tick', (_node, { progress }) => {
        transition.progress.call(this.component, this, prop, progress, prevProgress)
        prevProgress = progress
      })
    }

    f.once('stopped', () => {
      if (
        this.scheduledTransitions[prop] !== undefined &&
        this.scheduledTransitions[prop].canceled === true
      ) {
        return
      }
      // fire transition end callback when animation ends (if specified)
      if (transition.end && typeof transition.end === 'function') {
        transition.end.call(this.component, this, prop, this.node[prop])
      }
      // remove the prop from scheduled transitions
      delete this.scheduledTransitions[prop]
    })

    // start animation
    f.start()
  },
  destroy() {
    Log.debug('Deleting  Node', this.nodeId)
    this.node.destroy()

    // Clearing transition end callback functions
    const transitionProps = Object.keys(this.scheduledTransitions)
    for (let i = 0; i < transitionProps.length; i++) {
      const transition = this.scheduledTransitions[transitionProps[i]]
      if (transition !== undefined) {
        transition.canceled = true
        if (transition.f !== undefined) transition.f.stop()
      }
    }
  },
  get nodeId() {
    return this.node && this.node.id
  },
  get ref() {
    return this.props.ref || null
  },
  get parent() {
    return this.node && this.node.parent
  },
  get children() {
    return this.component[symbols.getChildren]().filter((child) => {
      return child.parent === (this[symbols.isSlot] ? this.node.children[0] : this.node)
    })
  },
}

export default (config, component) => {
  if (textDefaults === null) {
    textDefaults = {
      fontSize: 32,
      fontFamily: Settings.get('defaultFont', 'sans-serif'),
    }
  }
  return Object.assign(Object.create(Element), {
    props: Object.assign(Object.create(propsTransformer), { props: {} }),
    scheduledTransitions: {},
    config,
    component,
  })
}
