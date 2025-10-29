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

import Settings from './settings.js'
import { initLog, Log } from './lib/log.js'
import engine from './engine.js'
import blitsPackageInfo from '../package.json' with { type: 'json' }

/**
 * @typedef {Object} Font
 * @property {string} family - Name of the font family
 * @property {string} type - Type of font (web, msdf, sdf)
 * @property {string} [file] - Location to the font file
 * @property {string} [json] - Location of the font map (for msdf/sdf)
 * @property {string} [png] - Location of the font png (for msdf/sdf)
 */
/**
 * @typedef {Object} ShaderEffect
 * @property {string} name
 * @property {any} type
 */
/**
 * @typedef {Object} Shader
 * @property {string} name
 * @property {any} type
 */

/**
 * @typedef {import('@lightningjs/renderer').RendererMain} RendererMain
 * @type {RendererMain}
 */
// @ts-ignore - We ignore this because it will be replaced by the renderer once the app is launched
export let renderer = {}
export const stage = {}

async function rendererVersion() {
  let rendererPackageInfo
  try {
    // Dynamically import the renderer package.json
    rendererPackageInfo = await import('../../renderer/package.json')
    if (rendererPackageInfo !== undefined) {
      return rendererPackageInfo.version
    }
  } catch (e) {
    // Fallback to renderer version in dependencies
    return blitsPackageInfo.dependencies['@lightningjs/renderer']
  }
}

/**
 * @typedef {Object} BlitsSettings
 * @property {number} [w] - Width of the Application
 * @property {number} [h] - Height of the Application
 * @property {boolean} [multithreaded] - Whether to enable multithreaded
 * @property {0|1|2|"info"|"warn"|"error"|"debug"[]} [debugLevel] - Debug level for console log messages
 * @property {Font[]} [fonts] - Fonts to be used in the Application
 * @property {ShaderEffect[]} [effects] - Effects to be used by DynamicShader
 * @property {Shader[]} [shaders] - Shaders to be used in the application
 * @property {string} [defaultFont] - Default font family to use in the Application
 * @property {object} [keymap] - Custom keymapping
 * @property {"Proxy"|"defineProperty"} [reactivityMode] - Mode of reactivity
 * @property {"hd"|"720p"|720|"fhd"|"fullhd"|"1080p"|1080|"4k"|"2160p"|2160} [screenResolution] - Screen resolution of the device
 * @property {"low"|"medium"|"high"|"retina"|number} [renderQuality] - Quality of the rendered App
 * @property {number} [pixelRatio] - Custom pixel ratio of the device
 * @property {number} [fpsInterval] - Interval in ms to receive FPS updates
 * @property {number} [webWorkersLimit] - Maximum number of web workers
 * @property {string} [canvasColor] - Background color of the canvas
 * @property {boolean} [inspector] - Enable inspector
 * @property {number|[number,number,number,number]} [viewportMargin] - Extra margin to the viewport
 * @property {number} [gpuMemoryLimit] - Threshold after which textures are freed (deprecated)
 * @property {object} [gpuMemory] - Configures the gpu memory settings
 * @property {"webgl"|"canvas"} [renderMode] - Defines which mode the renderer should operate in
 * @property {number} [holdTimeout] - Time after which a key press is considered a hold
 * @property {HTMLCanvasElement} [canvas] - Custom canvas object used to render the App
 * @property {number} [textureProcessingTimeLimit] - Max time renderer can process textures in a frame
 * @property {Partial<import('@lightningjs/renderer').RendererMainSettings>} [advanced] - Advanced renderer settings
 * @property {boolean} [announcer] - Whether or not the announcer should be activated on initialization
 * @property {number} [maxFPS] - Maximum FPS
 */

/**
 * Blits App defines the structure of the Blits application.
 * @typedef {import('./component').BlitsComponent} BlitsComponent
 * @typedef {BlitsComponent & { quit: () => void }} BlitsAppComponent
 * @typedef {() => BlitsAppComponent} BlitsAppFactory
 */

/**
 * Launches the Blits application with the given App, target, and settings.
 * Sets up logging, version info, and initializes the renderer and stage singletons.
 *
 * @param {BlitsAppFactory} App - The root BlitsComponent to launch.
 * @param {HTMLElement} target - The DOM element or rendering target.
 * @param {BlitsSettings} settings - Configuration settings for the application.
 * @returns {void}
 */
export default (App, target, settings) => {
  Settings.set(settings)

  initLog()

  rendererVersion().then((v) => {
    Log.info('Blits Version ', blitsPackageInfo.version)
    Log.info('Renderer Version ', v)
  })

  stage.element = engine.Element

  renderer = engine.Launch(App, target, settings)
}
