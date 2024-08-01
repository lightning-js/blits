export const plugins = {}

const registerPlugin = (plugin, nameOrOptions = '', options = {}) => {
  // map name and options depending on the arguments provided
  let name
  if (typeof nameOrOptions === 'object') {
    options = nameOrOptions
    name = ''
  } else {
    name = nameOrOptions
  }

  if (typeof plugin === 'function') {
    if (name === '') {
      throw Error('Error registering plugin: name is required for plugin')
    }
    plugins[name] = { plugin, options }
  } else if (plugin.plugin) {
    registerPlugin(plugin.plugin, plugin.name, options)
  }
}

export default registerPlugin
