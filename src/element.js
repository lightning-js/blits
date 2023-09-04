import { renderer } from './launch.js'
import colors from './lib/colors/colors.js'

import { Log } from './lib/log.js'

const colorProps = ['color', 'colorTop', 'colorBottom', 'colorLeft', 'colorRight']

export default (config) => {
  let node = null
  let initData = null
  let setProperties = []

  return {
    populate(data) {
      const props = {
        ...config,
        ...data,
      }
      initData = data

      if (config.parentId) {
        props.parent =
          config.parentId === 'root' ? renderer.root : renderer.getNodeById(config.parentId)
      }

      Object.keys(props).forEach((prop) => {
        props[prop] =
          typeof props[prop] === 'object' && prop !== 'parent'
            ? unPackValue(props[prop])
            : props[prop]
        // if (prop === 'color') {
        if (colorProps.indexOf(prop) > -1) {
          props[prop] = colors.normalize(props[prop])
        }
        if (prop === 'show') {
          props['alpha'] = props[prop] ? 1 : 0
        }
        if (prop === 'rotation') {
          props[prop] = props[prop] * (Math.PI / 180)
        }
        if (prop === 'text') {
          props[prop] = (props[prop] || '').toString()
        }
        setProperties.push(prop)
      })

      node = 'textnode' in props ? renderer.createTextNode(props) : renderer.createNode(props)
    },
    set(prop, value) {
      if (typeof value === 'object' && 'transition' in value && setProperties.indexOf(prop) > -1) {
        this.animate(prop, value.transition)
      } else if (prop === 'parentId') {
        node.parent = value === 'root' ? renderer.root : renderer.getNodeById(value)
      } else if (prop === 'effects' && value) {
        // todo: only 1 shader for now (well, there _exists_ only one shader now ;) )
        node.shader = value[0]
      } else if (prop === 'show') {
        node.alpha = value ? 1 : 0
      } else if (prop === 'rotation') {
        node.rotation = value * (Math.PI / 180)
      } else if (prop === 'texture') {
        node.texture = value
      } else {
        value = unPackValue(value)
        if (colorProps.indexOf(prop) > -1) {
          // if (prop === 'color') {
          value = colors.normalize(value)
        }
        node[prop] = value
      }
      setProperties.indexOf(prop) === -1 && setProperties.push(prop)
    },
    delete() {
      Log.debug('Deleting  Node', this.nodeId, node)
      node.parent = null
    },
    get nodeId() {
      return node && node.id
    },
    get id() {
      return initData.id || null
    },
    animate(prop, value) {
      const obj = {}
      let v = unPackValue(value)
      if (prop === 'color') {
        v = colors.normalize(v)
      } else if (prop === 'rotation') {
        v = v * (Math.PI / 180)
      }
      obj[prop] = v
      if (node[prop] !== obj[prop]) {
        const f = node.animate(obj, {
          duration: typeof value === 'object' ? ('d' in value ? value.d : 200) : 200,
          easing: typeof value === 'object' ? ('f' in value ? value.f : 'linear') : 'linear',
        })
        value.w ? setTimeout(() => f.start(), value.w) : f.start()
      }
    },
  }
}

const unPackValue = (obj) => {
  if (typeof obj === 'object' && obj.constructor.name === 'Object') {
    if ('v' in obj) {
      return obj.v
    } else {
      return unPackValue(obj[Object.keys(obj).pop()])
    }
  } else {
    return obj
  }
}
