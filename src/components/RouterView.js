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

import Component from '../component.js'
import Router from '../router/router.js'

let hashchangeHandler = null

export default () =>
  Component('RouterView', {
    template: `
      <Element w="100%" height="100%"></Element>
    `,
    state() {
      return {
        activeView: null,
      }
    },
    hooks: {
      ready() {
        hashchangeHandler = () => Router.navigate.apply(this)
        Router.navigate.apply(this)
        window.addEventListener('hashchange', hashchangeHandler)

      },
      destroy() {
        window.removeEventListener('hashchange', hashchangeHandler, false)
      },
      focus() {
        this.activeView && this.activeView.$focus()
      },
    },
    input: {
      back(e) {
        const navigating = Router.back.call(this)
        if (navigating === false) {
          this.parent.$focus(e)
        }
      },
    },
  })
