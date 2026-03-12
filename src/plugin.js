/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import log from './plugins/log.js'

export const plugins = {
  // log plugin added by default
  log,
}

const registerPlugin = (plugin, nameOrOptions = '', options = {}) => {
  // map name and options depending on the arguments provided
  let name = undefined
  if (typeof nameOrOptions === 'object') {
    options = nameOrOptions
  } else {
    name = nameOrOptions
  }

  if (typeof plugin === 'function') {
    if (name === undefined || name === '') {
      throw Error('Error registering plugin: name is required for plugin')
    }
    plugins[name] = { plugin, options }
  } else if (plugin.plugin) {
    registerPlugin(plugin.plugin, name || plugin.name, options)
  }
}

export default registerPlugin
