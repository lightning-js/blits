import { MainRenderDriver, RendererMain, ThreadXRenderDriver } from '@lightningjs/renderer'

export let renderer

export default (App, target, settings) => {
  const driver =
    settings.workers && settings.workers.renderer
      ? new ThreadXRenderDriver({
          RendererWorker: settings.workers.renderer,
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
