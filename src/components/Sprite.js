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
      <Element w="100%" h="100%" :texture="$texture" :color="$color" :effects="$effects" />
    `,
    props: ['image', 'map', 'frame', 'color', 'effects'],

    state() {
      return {
        spriteTexture: null,
        currentSrc: null,
      }
    },

    computed: {
      texture() {
        // If no image - nothing to render
        const source = this.image || this.src
        if (!source) return null

        // ensure renderer is available
        const renderer = this[symbols.renderer]()
        if (!renderer || !renderer.createTexture) {
          return null
        }

        //  Recreate only when image src changes
        if (!this.spriteTexture || this.currentSrc !== source) {
          this.spriteTexture = renderer.createTexture('ImageTexture', {
            src: source,
          })
          this.currentSrc = source
        }

        //  Resolve frame data from sprite map
        let options = null
        if (this.map && this.frame) {
          options =
            'frames' in this.map
              ? Object.assign({}, this.map.defaults || {}, this.map.frames[this.frame])
              : this.map[this.frame]
        }

        //  If no map but frame is object (manual subtexture)
        if (!options && typeof this.frame === 'object') {
          options = this.frame
        }

        // Create SubTexture only if frame data exists
        if (options) {
          return renderer.createTexture('SubTexture', {
            texture: this.spriteTexture,
            x: options.x,
            y: options.y,
            width: options.w,
            height: options.h,
          })
        }

        // Default fallback (single image)
        return this.spriteTexture
      },
    },
  })
