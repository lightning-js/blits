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

import Settings from '../../settings.js'
import engine from '../../engine.js'
import { Log } from '../../lib/log.js'

// settings that can be changed at runtime
const changeableKeys = ['canvasColor', 'fpsInterval', 'pixelRatio']

export default {
  $settings: {
    value: {
      get(key, defaultValue) {
        return Settings.get(key, defaultValue)
      },
      set(key, value) {
        if (changeableKeys.indexOf(key) === -1) {
          Log.warn(`Setting "${key}" can not be changed at runtime`)
          return
        }
        Settings.set(key, value)
        engine.updateSetting(key, value)
      },
    },
    writable: false,
    enumerable: true,
    configurable: false,
  },
}
