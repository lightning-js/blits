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
      coreExtensionModule: settings.coreExtensionModule,
    },
    target,
    driver
  )

  let app

  const handler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handler)
      app.destroy()
      app = null
      renderer = null
    }
  }

  document.addEventListener('keydown', handler)

  renderer.init().then(() => (app = App()))
}
