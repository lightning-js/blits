import log from './plugins/log'

export const plugins = {
  // log plugin added by default
  log,
}

const registerPlugin = (plugin, nameOrOptions = '', options = {}) => {
  // map name and options depending on the arguments provided
  let name = undefined
  if (typeof nameOrOptions === 'object') {
    options = nameOrOptions
  } else {
    name = nameOrOptions
  }

  if (typeof plugin === 'function') {
    if (name === undefined) {
      throw Error('Error registering plugin: name is required for plugin')
    }
    plugins[name] = { plugin, options }
  } else if (plugin.plugin) {
    registerPlugin(plugin.plugin, name || plugin.name, options)
  }
}

export default registerPlugin
