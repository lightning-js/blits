import app from './lib/app.js'

import Component from './component.js'

const Application = (config, target = null) => {

  const a = app({w: 1920, h: 1080, clearColor: 0xff000000})

  const application = Component('App', config)()

  if(target && target instanceof Element === false) {
    target = document.getElementById(target)
  }

  target && target.appendChild(a.canvas)
  return application

}

export default Application
