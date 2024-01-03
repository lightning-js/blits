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

interface SdfFont {
  /**
  * Name of the font family
  */
  family: string,
  /**
  * Type of font (msdf or sdf)
  */
  type: 'msdf' | 'sdf',
  /**
  * Location of the font map (i.e. `'/fonts/Lato-Regular.msdf.json'`)
  */
  json: string,
  /**
  * Location of the font png (i.e. `'/fonts/Lato-Regular.msdf.png'`)
  */
  png: string
}

type ScreenResolutions = 'hd' | '720p' | 720 | 'fhd' | 'fullhd' | '1080p' | 1080 | '4k' | '2160p' | 2160

type Font = WebFont | SdfFont

export type DebugLevel = 0 | 1 | 2
export type LogTypes = 'info' | 'warn' | 'error' | 'debug'
export type ReactivityModes = 'Proxy' | 'defineProperty'

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
  debugLevel?: DebugLevel | LogTypes[]
  /**
   * Font loader file
   */
  fontLoader?: any
  /**
   * Fonts to be used in the Application
   */
  fonts?: Font[],
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
