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
import { SCREEN_RESOLUTIONS, RENDER_QUALITIES } from '../../constants.js'
import colors from '../../lib/colors/colors.js'
import fontLoader from './fontLoader.js'
import shaderLoader from './shaderLoader.js'
import { getRequiredFontEngines } from './fontTypes.js'
import { platform } from '../../platform.js'

/** @type {RendererMain|{}} */
export let renderer = {}

const renderEngine = async (settings) => {
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'

  if (renderMode === 'canvas') {
    const canvasModule = await import('@lightningjs/renderer/canvas')
    return canvasModule.CanvasCoreRenderer
  }
  const webglModule = await import('@lightningjs/renderer/webgl')
  return webglModule.WebGlCoreRenderer
}

export const textRenderEngines = async (settings) => {
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'

  // SDF text rendering is not compatible with the Canvas core renderer
  if (renderMode === 'canvas') {
    const canvasModule = await import('@lightningjs/renderer/canvas')
    return [canvasModule.CanvasTextRenderer]
  }

  const webglModule = await import('@lightningjs/renderer/webgl')
  // Only register the font engines actually required by the configured
  // fonts, so unused text renderers are never initialized.
  const { hasSdfFont, hasCanvasFont } = getRequiredFontEngines(settings.fonts)
  if (hasSdfFont === true && hasCanvasFont === true) {
    const canvasModule = await import('@lightningjs/renderer/canvas')
    return [webglModule.SdfTextRenderer, canvasModule.CanvasTextRenderer]
  }
  if (hasSdfFont === true) {
    return [webglModule.SdfTextRenderer]
  }
  // Canvas-only fonts, or no fonts declared at all (system/default fonts
  // render via the Canvas engine, which can render any font family).
  const canvasModule = await import('@lightningjs/renderer/canvas')
  return [canvasModule.CanvasTextRenderer]
}

const loadInspector = async (settings) => {
  if (settings.inspector === true) {
    const inspectorModule = await import('@lightningjs/renderer/inspector')
    return inspectorModule.Inspector
  }
  return undefined
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
 * @returns {Promise<RendererMain>} The initialized renderer
 *
 */
export default async (App, target, settings = {}) => {
  const screenHeight = settings.platform ? settings.platform.screenHeight : platform.screenHeight
  const hardwareConcurrency = settings.platform
    ? settings.platform.hardwareConcurrency
    : platform.hardwareConcurrency

  // Load only the backend modules required for the configured renderMode.
  // The unselected backend (and the inspector, unless enabled) is never
  // fetched, parsed, or evaluated.
  const [coreRenderer, fontEngines, inspector] = await Promise.all([
    renderEngine(settings),
    textRenderEngines(settings),
    loadInspector(settings),
  ])

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
          SCREEN_RESOLUTIONS[screenHeight] ||
          1,
        numImageWorkers:
          'webWorkersLimit' in settings
            ? settings.webWorkersLimit
            : Math.min(hardwareConcurrency || 2, 2),
        clearColor: (settings.canvasColor && colors.normalize(settings.canvasColor)) || 0x00000000,
        inspector: inspector,
        boundsMargin: settings.viewportMargin || 0,
        renderEngine: coreRenderer,
        fontEngines: fontEngines,
        canvas: settings.canvas,
        textureProcessingTimeLimit: settings.textureProcessingTimeLimit,
        textureMemory: textureMemorySettings(settings),
        createImageBitmapSupport: 'auto',
        targetFPS: 'maxFPS' in settings ? settings.maxFPS : 0,
        platform: settings.rendererPlatform || null,
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

  await shaderLoader()
  fontLoader()
  // Defer app initialization until after the current call stack is cleared,
  // allowing the renderer to finish setting up before the app starts creating components
  Promise.resolve().then(initApp)

  return renderer
}
