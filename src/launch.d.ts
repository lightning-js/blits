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

import ApplicationInstance from './application'
import {type Stage, type ShaderEffect as RendererShaderEffect, type WebGlCoreShader} from '@lightningjs/renderer'
interface WebFont {
  /**
  * Name of the font family
  */
  family: string,
  /**
  * Type of font (web)
  */
  type: 'web',
  /**
  * Location to the font file (i.e. `/fonts/OpenSans-Medium.ttf`)
  */
  file: string
}

interface SdfFontWithFile {
  /**
    * Location of the font file (i.e. `/fonts/OpenSans-Medium.ttf`)
    */
  file: string
}

interface SdfFontWithPngJson {
  /**
  * Location of the font map (i.e. `'/fonts/Lato-Regular.msdf.json'`)
  */
  json: string,
  /**
  * Location of the font png (i.e. `'/fonts/Lato-Regular.msdf.png'`)
  */
  png: string
}

type SdfFont = {
  /**
  * Name of the font family
  */
  family: string,
  /**
  * Type of font (msdf or sdf)
  */
  type: 'msdf' | 'sdf',
} & (SdfFontWithFile | SdfFontWithPngJson)

type Shader = {
  name: string,
  type: WebGlCoreShader
}

type ShaderEffect = {
  name: string,
  type: RendererShaderEffect
}

type ScreenResolutions = 'hd' | '720p' | 720 | 'fhd' | 'fullhd' | '1080p' | 1080 | '4k' | '2160p' | 2160

type Font = WebFont | SdfFont

export type DebugLevel = 0 | 1 | 2
export type LogTypes = 'info' | 'warn' | 'error' | 'debug'
export type ReactivityModes = 'Proxy' | 'defineProperty'
export type RenderModes = 'webgl' | 'canvas'

interface ExtensionLoader {
  async (stage: Stage): void
}
/**
 * Settings
 *
 * Launcher function that sets up the Lightning renderer and instantiates
 * the Blits App
 */
export interface Settings {
  /**
   * Width of the Application
   */
  w?: number,
  /**
   * Height of the Application
   */
  h?: number,
  /**
   * Whether to enable multithreaded
   */
  multithreaded?: boolean,
  /**
   * Debug level for console log messages
   */
  debugLevel?: DebugLevel | LogTypes[],
  /**
   * Fonts to be used in the Application
   */
  fonts?: Font[],
  /**
   * Effects to be used by DynamicShader
   */
  effects?: ShaderEffect[],
  /**
   * Shaders to be used in the application
   */
  shaders?: Shader[],
  /**
   * Default font family to use in the Application when no font attribute is specified
   * on a Text-component
   *
   * The default font must be registered in the `fonts` array in the settings.
   *
   * Defaults to `sans-serif` font family, which is the default of the Lightning Renderer
   */
  defaultFont?: string,
  /**
   * Custom keymapping
   */
  keymap?: object,
  /**
   * Mode of reactivity (`Proxy` or `defineProperty`)
   */
  reactivityMode?: ReactivityModes,
  /**
  * Screen resolution of the device, defining the pixelRatio used to convert dimensions
  * and positions in the App code to the actual device logical coordinates
  *
  * If not supplied, Blits will try to autodetect the device screen resolution. Otherwise
  * the exact dimensions and positions used the app code are used.
  *
  * Note: If the option `pixelRatio` is specified in the Settings object, this value will take presedence
  * over the screen resolution setting.
  *
  * Currently 3 screen resolutions are supported, which can be defined with different alias values:
  *
  * For 720x1080 (1px = 0.66666667px)
  * - hd
  * - 720p
  * - 720
  *
  * For 1080x1920 (1px = 1px)
  * - fhd
  * - fullhd
  * - 1080p
  * - 1080
  *
  * For 2160x3840 (1px = 2px)
  * - 4k
  * - 2160p
  * - 2160
  */
  screenResolution?: ScreenResolutions,
  /**
  * Custom pixel ratio of the device used to convert dimensions
  * and positions in the App code to the actual device logical coordinates
  *
  * Takes presedence over the `screenResolution` setting
  *
  * Defaults to 1 if not specified
  */
  pixelRatio?: number
  /**
   * Interval in milliseconds to receive FPS updates
   *
   * @remarks
   * If set to `0`, FPS updates will be disabled.
   *
   * @defaultValue `1000` (disabled)
   */
  fpsInterval?: number
  /**
  * Maximum number of web workers to spin up simultaneously for offloading functionality such
  * as image loading to separate threads (when supported by the browser)
  *
  * If not specified defaults to the number of logical processers available as reported by
  * `navigator.hardwareConcurrency` (or 2 if `navigator.hardwareConcurrency` is not supported)
  */
  webWorkersLimit?: number
  /**
   * Background color of the canvas (also known as the clearColor)
   *
   * Can be a color name (red, blue, silver), a hexadecimal color (`#000000`, `#ccc`),
   * or a color number in rgba order (`0xff0033ff`)
   *
   * Defauls to transparent (`0x00000000`)
   *
   */
  canvasColor?: string,
  /**
   * Enable inspector
   *
   * Enables the inspector tool for debugging and inspecting the application, the node tree
   * will be replicated in the DOM and can be inspected using the browser's developer tools
   *
   * Defaults to `false`
   */
  inspector?: boolean,
  /**
   * Add an extra margin to the viewport for earlier pre-loading of elements and components
   *
   * By default the Lightning renderer, only renders elements that are inside the defined viewport.
   * Everything outside of these bounds is removed from the render tree.
   *
   * With the viewportMargin you have the option to _virtually_ increase the viewport area,
   * to expedite the pre-loading of elements and / or delay the unloading of elements depending
   * on their position in the (virtual) viewport
   *
   * The margin can be specified in 4 directions by defining an array [top, right, bottom, left],
   * or as a single number which is then applied to all 4 directions equally.
   *
   * Defaults to `0`
   */
  viewportMargin?: number | [number, number, number, number],
  /**
   * Threshold in `Megabytes` after which all the textures that are currently not visible
   * within the configured viewport margin will be be freed and cleaned up
   *
   * When passed `0` the threshold is disabled and textures will not be actively freed
   * and cleaned up
   *
   * Defaults to `200` (mb)
   */
  gpuMemoryLimit?: number,
  /**
   * Defines which mode the renderer should operate in: `webgl` or `canvas`
   *
   * SDF fonts are not supported in _canvas_ renderMode. Instead, _web_ fonts should
   * be used. Also note that Canvas2d rendering doesnt support the use of shaders.
   *
   * Defaults to `webgl`
   */
  renderMode?: RenderModes,

  /**
   * The time, in milliseconds, after which Blits considers a key press a _hold_ key press
   *
   * During a hold key press the focus delegation behaviour is different: when scrolling
   * through a long list, focus is not handed over to each individual list item, creating a
   * smoother experience
   *
   * Defaults to `50` (ms)
   */
  holdTimeout?: number
}

/**
 * Blits.Launch()
 *
 * Launcher function that sets up the Lightning renderer and instantiates
 * the Blits App
 */
declare function Launch(
  App: ApplicationInstance,
  target: HTMLElement | string,
  settings?: Settings,
) : void


export default Launch;
