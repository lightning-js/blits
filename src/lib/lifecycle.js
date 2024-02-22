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

import { Log } from './log.js'
import { emit, privateEmit } from './hooks.js'

const states = ['init', 'ready', 'focus', 'unfocus', 'destroy']

export default {
  previous: null,
  current: null,
  get state() {
    return this.current
  },
  set state(v) {
    if (states.indexOf(v) > -1 && v !== this.current) {
      Log.debug(
        `Setting lifecycle state from ${this.current} to ${v} for ${this.component.componentId}`
      )
      this.previous = this.current
      this.current = v
      // emit 'private' hook
      privateEmit(v, this.component.name, this.component)
      // emit 'public' hook
      emit(v, this.component.name, this.component)
    }
  },
}
