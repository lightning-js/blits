/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import Component from './component.js'

import Focus from './focus.js'

const Application = (config) => {
  // make configurable?
  const mapping = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Enter: 'enter',
    ' ': 'space',
  }

  const handler = (e) => {
    const key = mapping[e.key] || e.key
    Focus.input(key, e)
  }

  document.addEventListener('keydown', handler)

  config.hooks = config.hooks || {}
  config.hooks.___init = function () {
    Focus.set(this)
  }

  config.hooks.___destroy = function () {
    document.removeEventListener('keydown', handler)
  }

  const App = Component('App', config)

  return App
}

export default Application
