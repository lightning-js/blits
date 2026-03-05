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
      <Element w="100%" h="100%" :texture="$texture" :color="$color" effects="$effects" />
    `,
    props: ['image', 'map', 'frame', 'color', 'effects', '@loaded', '@error'],
    state() {
      return {
        spriteTexture: null,
        currentSrc: null,
      }
    },

    hooks: {
      ready() {
        const loaded = this['@loaded']
        if (loaded && typeof loaded === 'function') {
          const cb = (payload) => loaded({ w: payload?.w, h: payload?.h }, this[symbols.wrapper])
          this._loadedCb = cb
          if (this.spriteTexture !== undefined && this.spriteTexture !== null) {
            this.spriteTexture.on('loaded', cb)
          }
        }
        const error = this['@error']
        if (error && typeof error === 'function') {
          const cb = (payload) => error(payload, this[symbols.wrapper])
          this._failedCb = cb
          if (this.spriteTexture !== undefined && this.spriteTexture !== null) {
            this.spriteTexture.on('failed', cb)
          }
        }
      },
      destroy() {
        if (this.spriteTexture !== undefined && this.spriteTexture !== null) {
          if (this._loadedCb) this.spriteTexture.off('loaded', this._loadedCb)
          if (this._failedCb) this.spriteTexture.off('failed', this._failedCb)
        }
      },
    },

    computed: {
      texture() {
        // If no image - nothing to render
        if (this.image === undefined || this.image === null) {
          return null
        }

        // Get renderer
        const renderer = this[symbols.renderer]()
        if (renderer === null || renderer === undefined || renderer.createTexture === undefined) {
          return null
        }

        // Recreate texture only when image src changes
        if (
          this.spriteTexture === undefined ||
          this.spriteTexture === null ||
          this.currentSrc !== this.image
        ) {
          const prevTexture = this.spriteTexture
          if (prevTexture !== undefined && prevTexture !== null) {
            if (this._loadedCb) prevTexture.off('loaded', this._loadedCb)
            if (this._failedCb) prevTexture.off('failed', this._failedCb)
          }
          this.spriteTexture = renderer.createTexture('ImageTexture', {
            src: this.image,
          })
          this.currentSrc = this.image
          if (this._loadedCb) this.spriteTexture.on('loaded', this._loadedCb)
          if (this._failedCb) this.spriteTexture.on('failed', this._failedCb)
        }

        // Resolve frame data from sprite map
        let options = null
        if (
          this.map !== null &&
          this.map !== undefined &&
          this.frame !== null &&
          this.frame !== undefined
        ) {
          if (
            this.map.frames !== null &&
            this.map.frames !== undefined &&
            this.frame in this.map.frames
          ) {
            options = Object.assign({}, this.map.defaults || {}, this.map.frames[this.frame])
          } else if (this.frame in this.map) {
            options = this.map[this.frame]
          }
        }

        // If no map but frame is object (manual subtexture)
        if ((options === null || options === undefined) && typeof this.frame === 'object') {
          options = this.frame
        }

        // Create SubTexture only if frame data exists
        if (options !== null && options !== undefined) {
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
