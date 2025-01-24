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

import symbols from '../lib/symbols.js'

export default () =>
  Component('Sprite', {
    template: `
      <Element w="100%" h="100%" :texture="$texture" :color="$color" />
    `,
    props: ['image', 'map', 'frame', 'color'],
    state() {
      return {
        spriteTexture: null,
      }
    },
    computed: {
      texture() {
        const options =
          'frames' in this.map
            ? Object.assign({}, this.map.defaults || {}, this.map.frames[this.frame])
            : this.map[this.frame]

        if (this.spriteTexture !== null && options) {
          return this[symbols.renderer]().createTexture('SubTexture', {
            texture: this.spriteTexture,
            x: options.x,
            y: options.y,
            width: options.w,
            height: options.h,
          })
        }
      },
    },
    hooks: {
      ready() {
        this.spriteTexture = this[symbols.renderer]().createTexture('ImageTexture', {
          src: this.image,
        })
      },
    },
  })
