import { renderer } from './launch.js'
import colors from './lib/colors.js'

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
        if (prop === 'color') {
          props[prop] = colors.normalize(props[prop])
        }
        setProperties.push(prop)
      })

      node = renderer.createNode(props)
    },
    set(prop, value) {
      if (typeof value === 'object' && 'transition' in value && setProperties.indexOf(prop) > -1) {
        this.animate(prop, value.transition)
      } else if (prop === 'imageSource') {
        node.src = value
      } else if (prop === 'parentId') {
        node.parent = value === 'root' ? renderer.root : renderer.getNodeById(value)
      } else {
        value = unPackValue(value)
        if (prop === 'color') {
          value = colors.normalize(value)
        }
        node[prop] = value
      }
      setProperties.indexOf(prop) === -1 && setProperties.push(prop)
    },
    delete() {
      node.parent = null
    },
    get nodeId() {
      return node.id
    },
    get id() {
      return initData.id || null
    },
    animate(prop, value) {
      const obj = {}
      let v = unPackValue(value)
      if (prop === 'color') {
        v = colors.normalize(v)
      }
      obj[prop] = v
      if (node[prop] !== obj[prop]) {
        const f = node.animate(
          obj,
          typeof value === 'object' ? ('d' in value ? value.d : 200) : 200
        )
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

// const normalizeColor = (color = '') => {
//   color = color.toString()

//   if (color.startsWith('rgba(')) {
//     //
//   }

//   if (!color.startsWith('0x')) {
//     color = '0x' + (color.length === 6 ? color + 'ff' : color)
//   }
//   const [prefix, r, g, b, a] = color.match(/.{2}/g)
//   return prefix + a + b + g + r
// }
