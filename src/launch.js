import { MainRenderDriver, RendererMain, ThreadXRenderDriver } from '@lightningjs/renderer'
import RendererWorker from '@lightningjs/renderer/workers/renderer?worker'
import Settings from './settings.js'
import { initLog } from './lib/log.js'

export let renderer

export default (App, target, settings) => {
  Settings.set(settings)

  initLog()

  const driver =
    settings.multithreaded === true
      ? new ThreadXRenderDriver({
          RendererWorker,
        })
      : new MainRenderDriver()

  renderer = new RendererMain(
    {
      width: settings.width || 1920,
      height: settings.height || 1080,
    },
    target,
    driver
  )

  renderer.init().then(App)
}
