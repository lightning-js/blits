export const plugins = {}

const registerPlugin = (plugin, name = false) => {
  if (typeof plugin === 'function') {
    if (!name) {
      throw Error('Error registering plugin: name is required')
    }
    plugins[name] = plugin
  } else if (plugin.plugin) {
    registerPlugin(plugin.plugin, plugin.name)
  }
}

export default registerPlugin
