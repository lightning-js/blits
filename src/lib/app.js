import { App } from '@lightningjs/lightning-renderer/index.js'

export let app

export default (config) => {

  app = App(config)

  return app
}
