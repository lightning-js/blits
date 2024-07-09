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

import { RendererMain } from '@lightningjs/renderer'
import { Log } from '../../lib/log.js'
import { screenResolutions } from '../../lib/utils.js'
import colors from '../../lib/colors/colors.js'
import fontLoader from './fontLoader.js'
import shaderLoader from './shaderLoader.js'

export let renderer

export default (App, target, settings = {}) => {
  if ('fontLoader' in settings) {
    Log.warn(
      `

Starting version 0.9.0 of Blits, the Launch setting \`fontLoader\` is not supported / required anymore.
You can remove the option from your \`src/index.js\`-file. And you can safely remove the file \`src/fontLoader.js\` from your project.
      `
    )
  }

  renderer = new RendererMain(
    {
      appWidth: settings.w || 1920,
      appHeight: settings.h || 1080,
      fpsUpdateInterval: settings.fpsInterval || 1000,
      deviceLogicalPixelRatio:
        settings.pixelRatio ||
        screenResolutions[settings.screenResolution] ||
        screenResolutions[window.innerHeight] ||
        1,
      numImageWorkers:
        'webWorkersLimit' in settings
          ? settings.webWorkersLimit
          : window.navigator.hardwareConcurrency || 2,
      clearColor: (settings.canvasColor && colors.normalize(settings.canvasColor)) || 0x00000000,
      enableInspector: settings.inspector || false,
      boundsMargin: settings.viewportMargin || 0,
      // gpu memory limit, converted from mb to bytes - defaults to 200mb
      txMemByteThreshold:
        'gpuMemoryLimit' in settings ? settings.gpuMemoryLimit * 1024 * 1024 : 200 * 1024 * 1024,
      renderMode: 'renderMode' in settings ? settings.renderMode : 'webgl',
    },
    target
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
  shaderLoader()
  fontLoader()
  initApp()
  // renderer.init().then(shaderLoader).then(fontLoader).then(initApp)

  return renderer
}
