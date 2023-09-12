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

import { Log } from './lib/log.js'

export const getHash = () => {
  return (document.location.hash || '/').replace(/^#/, '')
}

export const matchHash = (path, routes = []) => {
  const route = routes
    .filter((r) => {
      return r.path === path
    })
    .pop()
  return route
}

export const navigate = function () {
  if (this.parent.___routes) {
    const hash = getHash()
    const route = matchHash(hash, this.parent.___routes)
    if (route) {
      if (this.__currentView) {
        for (let i = 0; i < this.__currentView.___children.length - 1; i++) {
          if (this.__currentView.___children[i] && this.__currentView.___children[i].destroy) {
            this.__currentView.___children[i].destroy()
            this.__currentView.___children[i] = null
          }
        }
        this.__currentView.destroy()
        this.__currentView = null
      }
      this.___children[1] = this.__currentView = route.component(
        this.___props,
        this.___children[0],
        this
      )
      this.__currentView.focus()
    } else {
      Log.error(`Route ${hash} not found`)
    }
  }
}

export const to = (location) => {
  window.location.hash = `#${location}`
}

export default {
  navigate,
  to,
}
