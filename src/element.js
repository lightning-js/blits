import { renderer } from './launch.js'

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
        node[prop] = unPackValue(value)
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
    animate(prop, v) {
      const obj = {}
      obj[prop] = typeof v === 'object' ? v.v : v
      if (node[prop] !== obj[prop]) {
        const f = node.animate(obj, typeof v === 'object' ? ('d' in v ? v.d : 200) : 200)
        v.w ? setTimeout(() => f.start(), v.w) : f.start()
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
