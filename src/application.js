import app from './lib/app.js'

import Component from './component.js'

const Application = (config, target = null) => {

  const {stage} = app({w: 1920, h: 1080, clearColor: 0xff333333})

  const application = Component('App', config).apply()

  if(target && target instanceof Element === false) {
    target = document.getElementById(target)
  }

  target && target.appendChild(stage.getCanvas())
  return application

}

export default Application
