/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { MainCoreDriver, RendererMain } from '@lightningjs/renderer'
// import RendererWorker from '@lightningjs/renderer/workers/renderer?worker'
import { Log } from '../../lib/log.js'
// import coreExtensionModule from './fontLoader.js?importChunkUrl'

export let renderer

export default (App, target, settings) => {
  const driver = new MainCoreDriver()
  // settings.multithreaded === true
  //   ? new ThreadXRenderDriver({
  //       RendererWorker,
  //     })
  //   : new MainRenderDriver()

  renderer = new RendererMain(
    {
      appWidth: settings.w || 1920,
      appHeight: settings.h || 1080,
      coreExtensionModule: settings.fontLoader,
    },
    target,
    driver
  )

  const initApp = () => {
    let app = App()
    app.quit = () => {
      Log.info('Closing App')
      app.destroy()
      app = null
      renderer = null
    }
  }

  renderer.init().then(() => initApp())

  return renderer
}
