import Component from './component.js'

import Focus from './focus.js'

const Application = (config) => {
  // make configurable?
  const mapping = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Enter: 'enter',
    ' ': 'space',
  }

  const handler = (e) => {
    const key = mapping[e.key] || e.key
    Focus.input(key, e)
  }

  document.addEventListener('keydown', handler)

  config.hooks = config.hooks || {}
  config.hooks.___init = function () {
    Focus.set(this)
  }

  config.hooks.___destroy = function () {
    document.removeEventListener('keydown', handler)
  }

  const App = Component('App', config)

  return App
}

export default Application
