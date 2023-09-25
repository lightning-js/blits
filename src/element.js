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

const isTransition = (value) => {
  return typeof value === 'object' && 'transition' in value
}

const isObjectString = (str) => {
  return typeof str === 'string' && str.startsWith('{') && str.endsWith('}')
}

const parseToObject = (str) => {
  return JSON.parse(str.replace(/'/g, '"').replace(/([\w-_]+)\s*:/g, '"$1":'))
}

const transformations = {
  unpackTransition(obj) {
    if (typeof obj === 'object' && obj.constructor.name === 'Object') {
      if ('value' in obj) {
        return obj.value
      } else if ('transition' in obj) {
        return this.unpackTransition(obj.transition)
      } else {
        return obj
      }
    } else {
      return obj
    }
  },
  remap(props) {
    'w' in props && (props.width = props.w)
    delete props.w
    'h' in props && (props.height = props.h)
    delete props.h
    'z' in props && (props.zIndex = props.z)
    delete props.z
  },
  parentId(props) {
    props.parent = props.parentId === 'root' ? renderer.root : renderer.getNodeById(props.parentId)
    delete props.parentId
  },
  color(props) {
    if (
      typeof props.color === 'object' ||
      (isObjectString(props.color) && (props.color = parseToObject(props.color)))
    ) {
      const map = {
        top: 'colorTop',
        bottom: 'colorBottom',
        left: 'colorLeft',
        right: 'colorRight',
      }
      Object.entries(props.color).forEach((color) => {
        props[map[color[0]]] = colors.normalize(color[1])
      })
      delete props.mount
    } else {
      props.color = colors.normalize(props.color)
    }
  },
  mount(props) {
    if (
      typeof props.mount === 'object' ||
      (isObjectString(props.mount) && (props.mount = parseToObject(props.mount)))
    ) {
      const map = {
        x: 'mountX',
        y: 'mountY',
      }
      Object.entries(props.mount).forEach((mount) => {
        props[map[mount[0]]] = mount[1]
      })
      delete props.mount
    }
  },
  pivot(props) {
    if (
      typeof props.pivot === 'object' ||
      (isObjectString(props.pivot) && (props.pivot = parseToObject(props.pivot)))
    ) {
      const map = {
        x: 'pivotX',
        y: 'pivotY',
      }
      Object.entries(props.pivot).forEach((pivot) => {
        props[map[pivot[0]]] = pivot[1]
      })
      delete props.pivot
    }
  },
  show(props) {
    props.alpha = props.show ? 1 : 0
    delete props.show
  },
  rotation(props) {
    props.rotation = props.rotation * (Math.PI / 180)
  },
  text(props) {
    props.text = props.text.toString()
  },
  textureColor(props) {
    if (!('color' in props)) {
      props.color = 'src' in props || 'texture' in props ? '0xffffffff' : '0x00000000'
    }
  },
  effects(props) {
    props.shader = renderer.makeShader('DynamicShader', {
      effects: props.effects.map((eff) => {
        if (eff.props && eff.props.color) {
          eff.props.color = colors.normalize(eff.props.color)
        }
        return eff
      }),
    })

    delete props.effects
  },
  src(props, setProperties) {
    if (setProperties.indexOf('color') === -1) {
      props.color = 0xffffffff
    }
  },
  texture(props, setProperties) {
    this.src(props, setProperties)
  },
}

const Element = {
  defaults: {
    rotation: 0,
  },
  populate(data) {
    const props = {
      ...this.defaults,
      ...this.config,
      ...data,
    }
    this.initData = data

    transformations.remap(props)
    Object.keys(props).forEach((prop) => {
      if (transformations[prop]) {
        props[prop] = transformations.unpackTransition(props[prop])
        transformations[prop](props, this.setProperties)
      }
      this.setProperties.push(prop)
    })

    transformations.textureColor(props, this.setProperties)

    this.node = props.__textnode ? renderer.createTextNode(props) : renderer.createNode(props)

    if (props['@loaded']) {
      const event = props.__textnode ? 'textLoaded' : 'txLoaded'
      this.node.once(event, (el, { width: w, height: h }) => {
        props['@loaded']({ w, h }, this)
      })
    }

    if (props['@error']) {
      const event = props.__textnode ? 'textFailed' : 'txFailed'
      this.node.once(event, (el, error) => {
        props['@error'](error, this)
      })
    }
  },
  set(prop, value) {
    if (isTransition(value) && this.setProperties.indexOf(prop) > -1) {
      this.animate(prop, value.transition)
    } else {
      const props = {}
      if (prop !== 'texture') {
        props[prop] = transformations.unpackTransition(value)
      } else {
        props[prop] = value
      }

      transformations.remap(props)
      if (transformations[prop]) {
        transformations[prop](props, this.setProperties)
      }

      Object.keys(props).forEach((prop) => {
        this.node[prop] = props[prop]
      })
    }
    this.setProperties.indexOf(prop) === -1 && this.setProperties.push(prop)
  },
  delete() {
    Log.debug('Deleting  Node', this.nodeId, this.node)
    this.node.parent = null
  },
  get nodeId() {
    return this.node && this.node.id
  },
  get id() {
    return this.initData.id || null
  },
  animate(prop, value) {
    const props = {}
    props[prop] = transformations.unpackTransition(value)

    transformations.remap(props)

    if (transformations[prop]) {
      transformations[prop](props)
    }

    // works for now
    prop = Object.keys(props).pop()

    if (this.node[prop] !== props[prop]) {
      const f = this.node.animate(props, {
        duration: typeof value === 'object' ? ('duration' in value ? value.duration : 300) : 300,
        easing:
          typeof value === 'object' ? ('function' in value ? value.function : 'ease') : 'ease',
      })

      value.delay ? setTimeout(() => f.start(), value.delay) : f.start()
    }
  },
}

export default (config) =>
  Object.assign(Object.create(Element), {
    node: null,
    setProperties: [],
    initData: {},
    config,
  })
