import { App } from '../../node_modules/@lightningjs/renderer/index.js'

export let app

export default (config) => {

  app = App(config)

  return app
}
