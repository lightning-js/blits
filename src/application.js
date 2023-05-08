import Component from './component.js'

import Focus from './focus.js'

const Application = (config) => {
  // temporary location of mapping
  const mapping = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Enter: 'enter',
    ' ': 'space',
  }

  document.addEventListener('keydown', (e) => {
    const key = mapping[e.key] || e.key
    Focus.input(key, e)
  })

  config.hooks.___init = function () {
    Focus.set(this)
  }

  return Component('App', config)
}

export default Application
