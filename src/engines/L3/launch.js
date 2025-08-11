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
import { WebGlCoreRenderer, SdfTextRenderer } from '@lightningjs/renderer/webgl'
import { CanvasCoreRenderer, CanvasTextRenderer } from '@lightningjs/renderer/canvas'
import { Inspector } from '@lightningjs/renderer/inspector'

import { Log } from '../../lib/log.js'
import { SCREEN_RESOLUTIONS, RENDER_QUALITIES } from '../../constants.js'
import colors from '../../lib/colors/colors.js'
import fontLoader from './fontLoader.js'
import shaderLoader from './shaderLoader.js'

/** @type {RendererMain|{}} */
export let renderer = {}

const renderEngine = (settings) => {
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'

  if (renderMode === 'webgl') return WebGlCoreRenderer
  if (renderMode === 'canvas') return CanvasCoreRenderer
}

const textRenderEngines = (settings) => {
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'

  if (renderMode === 'webgl') return [SdfTextRenderer, CanvasTextRenderer]
  if (renderMode === 'canvas') return [CanvasTextRenderer]
}

const textureMemorySettings = (settings) => {
  const gpuMemory = {
    ...{
      max: 200,
      target: 0.8,
      cleanupInterval: 5000,
      baseline: 25,
      strict: false,
    },
    ...('gpuMemory' in settings === true ? settings.gpuMemory : {}),
  }

  return {
    criticalThreshold: gpuMemory.max * 1024 * 1024, // convert from mb to bytes
    targetThresholdLevel: gpuMemory.target,
    cleanupInterval: gpuMemory.cleanupInterval,
    baselineMemoryAllocation: gpuMemory.baseline * 1024 * 1024, // convert from mb to bytes
    doNotExceedCriticalThreshold: gpuMemory.strict,
  }
}

/**
 * Launch the render engine and application
 *
 * @param {import('../../launch.js').BlitsAppFactory} App - Factory function that returns the application instance (extends BlitsComponent with .quit())
 * @param {HTMLElement} target - The target element to render the application into
 * @param {Partial<import('../../launch.js').BlitsSettings>} [settings] - The settings for the renderer
 *
 */
export default (App, target, settings = {}) => {
  renderer = new RendererMain(
    {
      ...{
        appWidth: settings.w || 1920,
        appHeight: settings.h || 1080,
        fpsUpdateInterval: settings.fpsInterval || 1000,
        devicePhysicalPixelRatio:
          RENDER_QUALITIES[settings.renderQuality] || settings.renderQuality || 1,
        deviceLogicalPixelRatio:
          settings.pixelRatio ||
          SCREEN_RESOLUTIONS[settings.screenResolution] ||
          SCREEN_RESOLUTIONS[window.innerHeight] ||
          1,
        numImageWorkers:
          'webWorkersLimit' in settings
            ? settings.webWorkersLimit
            : window.navigator.hardwareConcurrency || 2,
        clearColor: (settings.canvasColor && colors.normalize(settings.canvasColor)) || 0x00000000,
        inspector: settings.inspector === true ? Inspector : undefined,
        boundsMargin: settings.viewportMargin || 0,
        renderEngine: renderEngine(settings),
        fontEngines: textRenderEngines(settings),
        canvas: settings.canvas,
        textureProcessingTimeLimit: settings.textureProcessingTimeLimit,
        textureMemory: textureMemorySettings(settings),
        createImageBitmapSupport: 'auto',
        targetFPS: 'maxFPS' in settings ? settings.maxFPS : 0,
      },
      ...(settings.advanced || {}),
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

  return renderer
}
