import { renderer } from './launch.js'

export default (config) => {
  let node = null
  return {
    populate(data) {
      const props = {
        ...config,
        ...data,
      }

      if (config.parentId) {
        props.parent =
          config.parentId === 'root' ? renderer.root : renderer.getNodeById(config.parentId)
      }

      node = renderer.createNode(props)
    },
    set(property, value) {
      if (property === 'imageSource') {
        node.src = value
      } else if (property === 'parentId') {
        node.parent = value === 'root' ? renderer.root : renderer.getNodeById(value)
      } else {
        node[property] = value
      }
    },
    delete() {
      node.parent = null
    },
    id() {
      return node.id
    },
  }
}
