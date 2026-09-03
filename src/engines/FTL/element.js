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

// BlitsElement-over-FTL. Mirrors the structure of `src/engines/L3/element.js`
// (populate / set / animate / destroy / layoutFn / propsTransformer) but emits
// FTL-native props and talks to the renderer ONLY through `nodeAdapter.js`.
//
// Phase-1 (core-only) deltas vs L3:
// - color: normalized `0xRRGGBBAA` -> `[r,g,b,a]` floats. Gradient objects,
//   shaders (rounded/border/shadow/shader), sprites (image/map/frame) and
//   `fit` are warn-once + ignored (phase 2).
// - show -> `visible` (FTL flag); alpha stays separate.
// - text nodes: element props + text props are split; text goes through
//   `ftlApp.createText()` (canvas engine). `color` on a text node becomes
//   `textColor`.
// - images: `src` string -> `ftlApp.createImage({ src })` -> `texture`.
//   `autoSize` mirrors the L3 `autosize` behavior when no w/h is given.
// - animate/transitions: warn-once, apply end value immediately, still fire
//   `transition.start/end` callbacks so components behave.
// - `node.on/off` compat shims are attached to each created FTL element so
//   Blits core (`component.js` attach/detach/enter/exit hooks calling
//   `wrapper.node.on('inBounds' | 'outOfBounds' | 'inViewport')`) works
//   unchanged. `inViewport` maps to `inBounds` (approximation, phase 2).
// - No FTL module is statically imported here (`ftlApp` comes from the
//   launch singleton at runtime), so the L3 bundle never pulls in FTL.

import adapter from './nodeAdapter.js'
import { ftlApp } from './launch.js'
import {
  parseToObject,
  isObjectString,
  isTransition,
  isZeroDurationTransition,
} from '../../lib/utils.js'
import colors from '../../lib/colors/colors.js'

import { Log } from '../../lib/log.js'
import symbols from '../../lib/symbols.js'
import Settings from '../../settings.js'

/** Warn-once helper for phase-1 out-of-scope props. */
const warned = {}
const warnOnce = (key, msg) => {
  if (warned[key] === true) return
  warned[key] = true
  Log.warn(`[Blits:FTL] ${msg}`)
}

/**
 * Convert a Blits color (any format accepted by `colors.normalize`) to an
 * FTL `[r,g,b,a]` float array.
 * @param {any} v
 * @returns {number[]|null}
 */
const colorToFtl = (v) => {
  if (v === null || v === undefined) return null
  const normalized = colors.normalize(typeof v === 'string' ? v : '' + v)
  const hex = ('' + normalized).replace('0x', '').replace('#', '')
  if (/^[0-9a-f]{8}$/i.test(hex) === false) return [1, 1, 1, 1]
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
    parseInt(hex.slice(6, 8), 16) / 255,
  ]
}

/**
 * Creates a padding object from a value and direction.
 */
const createPaddingObject = (padding, direction) => {
  if (padding === undefined) {
    return { start: 0, end: 0, oppositeStart: 0, oppositeEnd: 0 }
  }

  if (typeof padding === 'number') {
    return { start: padding, end: padding, oppositeStart: padding, oppositeEnd: padding }
  }

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

/**
 * Layout function for arranging children in a layout container.
 * Same algorithm as L3; writes go through direct assignment + dirty()
 * because FTL elements are not reactive.
 * @param {object} config - The layout configuration object.
 * @this {import('../../component.js').BlitsElement}
 */
const layoutFn = function (config) {
  const w = this.node.w
  const h = this.node.h

  const position = config.direction === 'vertical' ? 'y' : 'x'
  const oppositePosition = config.direction === 'vertical' ? 'x' : 'y'
  const oppositeMount = config.direction === 'vertical' ? 'mountX' : 'mountY'
  const dimension = config.direction === 'vertical' ? 'h' : 'w'
  const oppositeDimension = config.direction === 'vertical' ? 'w' : 'h'
  const padding = createPaddingObject(config.padding, config.direction)

  let offset = padding.start

  const children = this.node.children
  const childrenLength = children.length
  const elementChildren = this.children

  let otherDimension = 0
  const gap = config.gap || 0
  for (let i = 0; i < childrenLength; i++) {
    if (elementChildren[i] !== undefined && elementChildren[i].props.raw.show === false) {
      continue
    }
    const node = children[i]
    node[position] = offset
    node[oppositePosition] = padding.oppositeStart
    node.dirty()
    // todo: temporary text check, due to 1px width of empty text node
    if (dimension === 'w') {
      offset += node.w + (node.w !== (node.text ? 1 : 0) ? gap : 0)
    } else {
      offset += node.text ? (node.w > 1 ? node.h + gap : 0) : node.h !== 0 ? node.h + gap : 0
    }
    otherDimension = Math.max(
      otherDimension,
      node[oppositeDimension] + padding.oppositeStart + padding.oppositeEnd
    )
  }
  // adjust the size of the layout container
  this.node[dimension] = offset - gap + padding.end
  this.node[oppositeDimension] = otherDimension
  this.node.dirty()

  const align = {
    start: 0,
    end: 1,
    center: 0.5,
  }[config['align-items'] || 'start']

  if (align !== 0) {
    for (let i = 0; i < childrenLength; i++) {
      const node = children[i]
      node[oppositePosition] = otherDimension * align
      node[oppositeMount] = align
      node.dirty()
    }
  }

  // emit an updated event
  if (config['@updated'] !== undefined && (this.node.w !== w || this.node.h !== h)) {
    config['@updated']({ w: this.node.w, h: this.node.h }, this)
  }

  // trigger layout on parent if parent is a layout
  if (
    this.config.parent &&
    this.config.parent.eol !== true &&
    this.config.parent.props.__layout === true
  ) {
    this.config.parent.triggerLayout(this.config.parent.props)
  }
}

/**
 * Parses a percentage string or returns the value as-is.
 */
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

/**
 * Unpacks a transition value from an object or returns the value as-is.
 */
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

/** Transformed prop names that belong to the FTL text object, not the element. */
const textPropNames = [
  'text',
  'fontFamily',
  'fontSize',
  'textAlign',
  'textBaseline',
  'maxWidth',
  'maxHeight',
  'maxLines',
  'letterSpacing',
  'lineHeight',
  'contain',
  'textSuffix',
  'textTruncate',
  'textColor',
  'fontWeight',
  'fontStyle',
]

/**
 * Default text settings for text nodes (initialized on first use).
 * @type {object|null}
 */
let textDefaults = null

/**
 * @typedef {import('../../component.js').BlitsElement} BlitsElement
 * @this {BlitsElement} this
 */
const propsTransformer = {
  set parent(v) {
    this.props['parent'] = v === 'root' ? adapter.getRoot() : v.node
  },
  set rotation(v) {
    this.props['rotation'] = v * (Math.PI / 180)
  },
  set w(v) {
    this.props['w'] = parsePercentage.call(this, v, 'w')
  },
  set h(v) {
    this.props['h'] = parsePercentage.call(this, v, 'h')
  },
  set x(v) {
    this.props['x'] = parsePercentage.call(this, v, 'w')
  },
  set y(v) {
    this.props['y'] = parsePercentage.call(this, v, 'h')
  },
  set z(v) {
    this.props['zIndex'] = v
  },
  set zIndex(v) {
    this.props['zIndex'] = v
  },
  set color(v) {
    if (typeof v === 'string' && v.startsWith('{') === false) {
      this.props['color'] = colorToFtl(v)
      this.props['textColor'] = colorToFtl(v)
    } else if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      // Gradient color objects ({top, bottom, ...}) need shader support (phase 2).
      warnOnce('color-gradient', 'gradient colors are not supported in FTL phase 1, ignoring')
    }
  },
  set src(v) {
    if (typeof v === 'object' || (isObjectString(v) === true && (v = parseToObject(v)))) {
      this.raw['src'] = v.src
    } else {
      this.raw['src'] = v
    }
    // Image texture is resolved at populate/set time via ftlApp.createImage.
    // Apply auto sizing when no width or height specified (mirrors L3 autosize).
    if (!('w' in this.raw) && !('h' in this.raw)) {
      this.props['autoSize'] = true
    }
  },
  set texture(v) {
    this.props['texture'] = v
  },
  set image(v) {
    this.raw['image'] = v
    warnOnce('sprite', 'native sprites (image/map/frame) are not supported in FTL phase 1')
  },
  set map(v) {
    this.raw['map'] = v
    warnOnce('sprite', 'native sprites (image/map/frame) are not supported in FTL phase 1')
  },
  set frame(v) {
    this.raw['frame'] = v
    warnOnce('sprite', 'native sprites (image/map/frame) are not supported in FTL phase 1')
  },
  set fit(v) {
    void v
    warnOnce('fit', "'fit' texture option is not supported in FTL phase 1")
  },
  set rtt(v) {
    this.props['rtt'] = v
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
      this.props['scaleX'] = v
      this.props['scaleY'] = v
    }
  },
  set show(v) {
    this.props['visible'] = !!v
  },
  set alpha(v) {
    this.props['alpha'] = v
  },
  set rounded(v) {
    warnOnce('shaders', 'rounded/border/shadow/shader effects need phase-2 shader bridge, ignoring')
  },
  set border(v) {
    warnOnce('shaders', 'rounded/border/shadow/shader effects need phase-2 shader bridge, ignoring')
  },
  set shadow(v) {
    warnOnce('shaders', 'rounded/border/shadow/shader effects need phase-2 shader bridge, ignoring')
  },
  set shader(v) {
    warnOnce('shaders', 'rounded/border/shadow/shader effects need phase-2 shader bridge, ignoring')
  },
  set clipping(v) {
    this.props['clip'] = !!v
  },
  set clipradius(v) {
    warnOnce('clipradius', "'clipradius' is not supported in FTL phase 1")
  },
  set overflow(v) {
    this.props['clip'] = !v
  },
  set font(v) {
    this.props['fontFamily'] = v
  },
  set size(v) {
    this.props['fontSize'] = v
  },
  set maxwidth(v) {
    this.props['maxWidth'] = v
    if (this.manualTextContain === true) {
      return
    }
    if (this.props['contain'] === 'height') {
      this.props['contain'] = 'both'
      return
    }
    this.props['contain'] = 'width'
  },
  set maxheight(v) {
    this.props['maxHeight'] = v
    if (this.manualTextContain === true) {
      return
    }
    if (this.props['contain'] === 'width') {
      this.props['contain'] = 'both'
      return
    }
    this.props['contain'] = 'height'
  },
  set maxlines(v) {
    this.props['maxLines'] = v
  },
  set textoverflow(v) {
    if (v === false) {
      this.props['textTruncate'] = false
    } else if (v === true) {
      this.props['textTruncate'] = true
    } else {
      this.props['textTruncate'] = true
      this.props['textSuffix'] = v
    }
  },
  set letterspacing(v) {
    this.props['letterSpacing'] = v || 1
  },
  set lineheight(v) {
    this.props['lineHeight'] = v
  },
  set contain(v) {
    this.props['contain'] = v
    this.manualTextContain = true
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

    if (x === 'center') {
      this.x = '50%'
      this.props['mountX'] = 0.5
    } else if (x === 'right') {
      this.x = '100%'
      this.props['mountX'] = 1
    }

    if (y === 'middle') {
      this.y = '50%'
      this.props['mountY'] = 0.5
    } else if (y === 'bottom') {
      this.y = '100%'
      this.props['mountY'] = 1
    }
  },
  set 'inspector-data'(v) {
    // Inspector is an L3-only concept in phase 1.
  },
  set data(v) {
    this.props['data'] = v
  },
  set holder(v) {
    // FTL has no interactive/holder nodes in phase 1.
    warnOnce('holder', "'holder' interactivity is not supported in FTL phase 1")
  },
}

export const elementAttributes = Object.keys(propsTransformer)

/**
 * Attach `.on/.off` compat shims to a raw FTL element so Blits core code
 * that calls `wrapper.node.on('inBounds' | ...)` keeps working unchanged.
 * @param {any} node - Raw FTL element.
 */
const attachNodeShims = (node) => {
  if (node.__blitsShimmed === true) return
  node.__blitsShimmed = true
  node.__blitsSubs = []
  node.on = (evt, cb) => {
    const unsub = adapter.on(node, evt, cb)
    if (typeof unsub === 'function') node.__blitsSubs.push({ evt, cb, unsub })
    return unsub
  }
  node.off = (evt, cb) => {
    const subs = node.__blitsSubs || []
    for (let i = subs.length - 1; i >= 0; i--) {
      if ((evt === undefined || subs[i].evt === evt) && (cb === undefined || subs[i].cb === cb)) {
        try {
          subs[i].unsub()
        } catch {
          // ignore unsubscribe errors during teardown
        }
        subs.splice(i, 1)
      }
    }
  }
  // Direct node.animate() (user code via element refs): route through the
  // adapter tween bridge with plain setProp writes.
  node.animate = (props, settings) => {
    const keys = Object.keys(props || {})
    if (keys.length === 0) {
      return { start: () => {}, stop: () => {}, state: 'stopped', once: () => {}, on: () => {} }
    }
    const key = keys[0]
    return adapter.animate(node, key, node[key], props[key], settings || {}, (v) =>
      adapter.setProp(node, key, v)
    )
  }
}

/**
 * Split transformed props into FTL element props vs text-object props.
 * @param {object} props
 * @returns {{ elProps: object, textProps: object }}
 */
const splitTextProps = (props) => {
  const elProps = {}
  const textProps = {}
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key === 'parent') {
      elProps[key] = props[key]
    } else if (textPropNames.indexOf(key) !== -1) {
      textProps[key] = props[key]
    } else if (key === 'color') {
      // element color stays null (transparent backdrop); textColor already set.
    } else {
      elProps[key] = props[key]
    }
  }
  return { elProps, textProps }
}

/**
 * Resolve a `src` raw value to an FTL texture via `ftlApp.createImage`.
 * @param {any} src
 * @returns {any|null} FTL texture or null when the app is not ready.
 */
const resolveImageTexture = (src) => {
  if (src === undefined || src === null || src === '') return null
  if (ftlApp === null || ftlApp === undefined) return null
  return ftlApp.createImage({ src })
}

const Element = {
  /**
   * Populates the element with data
   * @this {import('../../component.js').BlitsElement}
   * @param {import('../../component.js').BlitsElementProps} props
   */
  populate(props) {
    props['node'] = this.config.node

    if (props[symbols.isSlot] === true) {
      this[symbols.isSlot] = true
    }

    this.props.element = this

    this.props['parent'] = props['parent'] || this.config.parent
    delete props.parent

    this.props.raw = props
    this.props.elementShader = false

    const propKeys = Object.keys(props)
    const length = propKeys.length

    for (let i = 0; i < length; i++) {
      const key = propKeys[i]
      const value = props[key]
      if (value !== undefined) {
        this.props[key] = unpackTransition(value)
      }
    }

    // FTL containers default to transparent (color null = layout-only).
    // Text color is carried separately as textColor.
    const isTextNode = '__textnode' in props

    if (isTextNode === true) {
      const { elProps, textProps } = splitTextProps(this.props.props)
      if (this.props.props['color'] !== undefined && textProps['textColor'] === undefined) {
        textProps['textColor'] = this.props.props['color']
      }
      this.node = adapter.createTextNode(elProps, {
        ...textDefaults,
        ...textProps,
      })
    } else {
      const elProps = { ...this.props.props }
      delete elProps['textColor']
      if (this.props.raw['src'] !== undefined) {
        const texture = resolveImageTexture(this.props.raw['src'])
        if (texture !== null) {
          elProps['texture'] = texture
        }
      }
      // A defined color paints a rect; without color/texture the element is a
      // transparent layout container (FTL default, color null).
      if (elProps['color'] === undefined && elProps['texture'] === undefined) {
        elProps['color'] = null
      }
      this.node = adapter.createNode(elProps)
    }

    attachNodeShims(this.node)

    if (props['@loaded'] !== undefined && typeof props['@loaded'] === 'function') {
      this.node.on('loaded', (dimensions) => {
        props['@loaded']({ w: dimensions.w, h: dimensions.h }, this)
      })
    }

    if (props['@error'] !== undefined && typeof props['@error'] === 'function') {
      this.node.on('failed', (error) => {
        props['@error'](error, this)
      })
    }

    if (props.__layout === true) {
      this.triggerLayout = layoutFn.bind(this)
    }

    if (this.config.parent.props !== undefined && this.config.parent.props.__layout === true) {
      this.config.parent.triggerLayout(this.config.parent.props)
      this.node.on('loaded', () => {
        if (this.eol === true) return
        this.config.parent.triggerLayout(this.config.parent.props)
      })
    }
  },
  /**
   * @this {import('../../component.js').BlitsElement}
   */
  setInspectorMetadata() {
    // Inspector is L3-only in phase 1. Intentional no-op.
  },
  /**
   * Set an individual property on the node
   *
   * @this {import('../../component').BlitsElement} this
   * @param {import('../..//component.js').BlitsElementProps} prop
   * @param {any} value
   * @returns {void}
   */
  set(prop, value) {
    if (this.eol === true) return
    if (value === undefined) return
    if (this.props.raw[prop] === value) return
    this.props.raw[prop] = value

    this.props.props = {}
    this.props[prop] = unpackTransition(value)

    const propsKeys = Object.keys(this.props.props)

    if (propsKeys.length === 1) {
      if (isTransition(value) === true && isZeroDurationTransition(value) === false) {
        return this.animate(propsKeys[0], this.props.props[propsKeys[0]], value.transition)
      }
      this.applySingleProp(propsKeys[0], this.props.props[propsKeys[0]])
    } else {
      for (let i = 0; i < propsKeys.length; i++) {
        if (isTransition(value) === true && isZeroDurationTransition(value) === false) {
          this.animate(propsKeys[i], this.props.props[propsKeys[i]], value.transition)
        } else {
          this.applySingleProp(propsKeys[i], this.props.props[propsKeys[i]])
        }
      }
    }

    if (this.config.parent.props && this.config.parent.props.__layout === true) {
      this.config.parent.triggerLayout(this.config.parent.props)
    }
  },
  /**
   * Apply one transformed prop to the FTL node.
   * @this {import('../../component').BlitsElement} this
   */
  applySingleProp(key, value) {
    if (textPropNames.indexOf(key) !== -1) {
      if (this.node.text === null || this.node.text === undefined) return
      if (key === 'color') return
      this.node.text[key] = value
      this.node.dirty()
      return
    }
    if (key === 'parent') {
      // Re-parenting post-creation is not supported in phase 1.
      warnOnce('reparent', 're-parenting elements is not supported in FTL phase 1')
      return
    }
    if (key === 'texture') {
      adapter.setProp(this.node, 'texture', value)
      return
    }
    if (this.props.raw['src'] !== undefined && key !== 'src') {
      // keep existing texture; src changes are handled below
    }
    adapter.setProp(this.node, key, value)
  },
  animate(prop, value, transition) {
    if (this.eol === true) return

    // Clear any existing debounce timeout for this property
    if (this.debounceTimeouts[prop] !== undefined) {
      clearTimeout(this.debounceTimeouts[prop])
      Log.debug(`Cleared debounce timeout for property "${prop}"`)
    }

    // Debounce the animation execution
    this.debounceTimeouts[prop] = setTimeout(() => {
      delete this.debounceTimeouts[prop]
      this._executeAnimation(prop, value, transition)
    }, 0)
  },
  /**
   * Read the current (text-aware) value of a transformed prop.
   * @this {import('../../component').BlitsElement} this
   */
  _readProp(key) {
    if (
      textPropNames.indexOf(key) !== -1 &&
      this.node.text !== null &&
      this.node.text !== undefined &&
      key !== 'color'
    ) {
      return this.node.text[key]
    }
    return this.node[key]
  },
  /**
   * Build a write callback routing eased values to the right place.
   * @this {import('../../component').BlitsElement} this
   */
  _writeProp(key) {
    if (
      textPropNames.indexOf(key) !== -1 &&
      this.node.text !== null &&
      this.node.text !== undefined &&
      key !== 'color'
    ) {
      return (v) => {
        if (this.eol === true || this.node === null || this.node === undefined) return
        this.node.text[key] = v
        this.node.dirty()
      }
    }
    return (v) => {
      if (this.eol === true || this.node === null || this.node === undefined) return
      this.applySingleProp(key, v)
    }
  },
  _executeAnimation(prop, value, transition) {
    if (this.eol === true) return
    // check if a transition is already scheduled to run on the same prop
    // and cancels it if it does
    const stateOfAnimation =
      this.scheduledTransitions[prop] !== undefined
        ? this.scheduledTransitions[prop].f.state
        : undefined

    if (
      stateOfAnimation !== undefined &&
      (stateOfAnimation === 'scheduled' || stateOfAnimation === 'running')
    ) {
      this.scheduledTransitions[prop].f.stop(stateOfAnimation === 'running' ? false : true)
    }

    const startValue = this._readProp(prop)
    const startSnapshot = Array.isArray(startValue) ? startValue.slice() : startValue

    // if current value is the same as the value to animate to, instantly resolve
    if (Array.isArray(value) && Array.isArray(startValue)) {
      let equal = value.length === startValue.length
      for (let i = 0; equal === true && i < value.length; i++) {
        if (value[i] !== startValue[i]) equal = false
      }
      if (equal === true) return
    } else if (startValue === value) {
      return
    }

    const settings = {
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
    }

    let f
    try {
      f = adapter.animate(this.node, prop, startSnapshot, value, settings, this._writeProp(prop))
    } catch {
      this._applyInstant(prop, value, transition)
      return
    }

    // schedule the transition for this prop, so it can be canceled /
    // removed if another transition for the same prop starts in the mean time
    this.scheduledTransitions[prop] = {
      v: value,
      f,
    }

    if (transition.start !== undefined && typeof transition.start === 'function') {
      // fire transition start callback when animation really starts (depending on specified delay)
      f.once('animating', () => {
        transition.start.call(this.component, this, prop, startSnapshot)
      })
    }

    if (this.config.parent.props && this.config.parent.props.__layout === true) {
      f.on('tick', () => {
        if (this.eol === true || !this.config) return
        this.config.parent.triggerLayout(this.config.parent.props)
      })
    }

    if (transition.progress !== undefined && typeof transition.progress === 'function') {
      let prevProgress = 0
      f.on('tick', (_node, { progress }) => {
        if (this.eol === true || !this.config) return
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
      if (this.node !== undefined && transition.end && typeof transition.end === 'function') {
        transition.end.call(this.component, this, prop, this._readProp(prop))
      }
      // remove the prop from scheduled transitions
      delete this.scheduledTransitions[prop]
    })

    // start animation (guarded: a start-time engine failure falls back to
    // instant-apply so a broken tween can never wedge the component)
    try {
      f.start()
    } catch {
      delete this.scheduledTransitions[prop]
      this._applyInstant(prop, value, transition)
    }
  },
  /**
   * Instant fallback when no animation engine is available: apply the end
   * value so the app keeps working, and still fire the end callback.
   * @this {import('../../component').BlitsElement} this
   */
  _applyInstant(prop, value, transition) {
    if (this.eol === true) return
    warnOnce(
      'transitions',
      'transitions/animations apply instantly without the `animejs` peer (`npm i animejs`)'
    )
    this.props.raw[prop] = { value }
    this.set(prop, value)
    if (transition.end !== undefined && typeof transition.end === 'function') {
      transition.end.call(this.component, this, prop, this._readProp(prop))
    }
  },
  destroy() {
    if (this.eol === true) return
    this.eol = true

    if (this.node === null) return

    Log.debug('Deleting Node', this.nodeId)

    const debounceProps = Object.keys(this.debounceTimeouts)
    for (let i = 0; i < debounceProps.length; i++) {
      clearTimeout(this.debounceTimeouts[debounceProps[i]])
    }
    this.debounceTimeouts = null

    const transitionProps = Object.keys(this.scheduledTransitions)
    for (let i = 0; i < transitionProps.length; i++) {
      const transition = this.scheduledTransitions[transitionProps[i]]
      if (transition !== undefined) {
        transition.canceled = true
        if (transition.f !== undefined) transition.f.stop()
      }
    }
    this.scheduledTransitions = {}

    this.component = null
    delete this.component

    this.config = null
    delete this.config

    this.props.raw = {}
    this.props.element = null
    this.props.props = null
    this.props = {}
    delete this.props

    this.triggerLayout = null
    delete this.triggerLayout

    this.forComponent = null
    delete this.forComponent

    if (this.node.off !== undefined) {
      try {
        this.node.off()
      } catch {
        // ignore teardown errors
      }
    }
    adapter.destroy(this.node)
    this.node = null
  },
  get nodeId() {
    return this.node && this.node.id
  },
  get ref() {
    return this.props.ref || null
  },
  get parent() {
    return this.node && adapter.getParent(this.node)
  },
  get children() {
    const allChildren = this.component[symbols.getChildren]()
    const directChildren = []
    const l = allChildren.length
    for (let i = 0; i < l; i++) {
      const child = allChildren[i]
      if (
        child !== undefined &&
        child.parent === (this[symbols.isSlot] ? this.node.children[0] : this.node)
      ) {
        directChildren.push(child)
      }
    }

    return directChildren
  },
}

/**
 * Handle a `src` prop change: resolve a new image texture.
 * @this {import('../../component').BlitsElement} this
 */
const syncSrcTexture = function () {
  const texture = resolveImageTexture(this.props.raw['src'])
  if (texture !== null) {
    adapter.setProp(this.node, 'texture', texture)
    if (!('w' in this.props.raw) && !('h' in this.props.raw)) {
      adapter.setProp(this.node, 'autoSize', true)
    }
  }
}

// Patch `set` so `src` re-resolves the image texture (the transformer only
// records the raw value; resolution needs ftlApp at runtime).
const baseSet = Element.set
Element.set = function (prop, value) {
  if (prop === 'src' && this.eol !== true && this.node !== null && this.node !== undefined) {
    baseSet.call(this, prop, value)
    syncSrcTexture.call(this)
    if (this.config.parent.props && this.config.parent.props.__layout === true) {
      this.config.parent.triggerLayout(this.config.parent.props)
    }
    return
  }
  baseSet.call(this, prop, value)
}

/**
 * Returns a new Blits Element
 *
 * @param {Object} config - The configuration object for the element
 * @param {import('../../component.js').BlitsComponent} component - The component to which the element belongs
 * @returns {import('../../component.js').BlitsElement} - The new Blits Element
 */
export default (config, component) => {
  if (textDefaults === null) {
    textDefaults = {
      fontSize: 32,
      fontFamily: Settings.get('defaultFont', 'sans-serif'),
    }
  }
  return Object.assign(Object.create(Element), {
    eol: false,
    props: Object.assign(Object.create(propsTransformer), { props: {} }),
    scheduledTransitions: {},
    debounceTimeouts: {},
    config,
    component,
  })
}
