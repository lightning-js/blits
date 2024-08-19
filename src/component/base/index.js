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

import methods from './methods.js'
import scheduling from './timeouts_intervals.js'
import events from './events.js'
import log from './log.js'
import router from './router.js'
import announcer from './announcer.js'
import utils from './utils.js'
import symbols from '../../lib/symbols.js'

export default Object.defineProperties(
  {
    [symbols['pluginsRegistered']]: false,
  },
  { ...methods, ...scheduling, ...events, ...log, ...router, ...announcer, ...utils }
)
