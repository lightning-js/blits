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
import { renderer } from '../launch.js'
import fps_sprite from '../../public/assets/fps_sprite.base64.js'

export default () =>
  Component('FPScounter', {
    template: `
      <Element>
        <Element y="15" x="20">
          <Element>
            <Sprite image="$image" w="43" h="25" map="$sprite" frame="fps" />
            <Element x="58" y="2">
              <Sprite image="$image" x="0" h="20" w="20" map="$sprite" :frame="$fps[0]" />
              <Sprite image="$image" x="18" h="20" w="20" map="$sprite" :frame="$fps[1]" />
              <Sprite image="$image" x="36" h="20" w="20" map="$sprite" :frame="$fps[2]" />
            </Element>
          </Element>

          <Element x="150">
            <Sprite image="$image" y="2" w="48" h="25" map="$sprite" frame="avg" />
            <Element x="63" y="2">
              <Sprite image="$image" x="0" h="20" w="20" map="$sprite" :frame="$avgFps[0]" />
              <Sprite image="$image" x="18" h="20" w="20" map="$sprite" :frame="$avgFps[1]" />
              <Sprite image="$image" x="36" h="20" w="20" map="$sprite" :frame="$avgFps[2]" />
            </Element>
          </Element>

          <Element x="0" y="40" >
            <Sprite image="$image" x="-2" w="47" h="25" map="$sprite" frame="min" />
            <Element x="58" y="2">
              <Sprite image="$image" x="0" h="20" w="20" map="$sprite" :frame="$minFps[0]" />
              <Sprite image="$image" x="18" h="20" w="20" map="$sprite" :frame="$minFps[1]" />
              <Sprite image="$image" x="36" h="20" w="20" map="$sprite" :frame="$minFps[2]" />
            </Element>
          </Element>

          <Element x="150" y="40">
            <Sprite image="$image" w="53" h="25" map="$sprite" frame="max" />
            <Element x="63" y="2">
              <Sprite image="$image" x="0" h="20" w="20" map="$sprite" :frame="$maxFps[0]" />
              <Sprite image="$image" x="18" h="20" w="20" map="$sprite" :frame="$maxFps[1]" />
              <Sprite image="$image" x="36" h="20" w="20" map="$sprite" :frame="$maxFps[2]" />
            </Element>
          </Element>
        </Element>
      </Element>
    `,
    state() {
      return {
        image: fps_sprite,
        sprite: {
          defaults: {
            y: 1,
            w: 20,
            h: 20,
          },
          frames: {
            '-': { x: -1000 },
            0: { x: 1 },
            1: { x: 23 },
            2: { x: 45 },
            3: { x: 67 },
            4: { x: 89 },
            5: { x: 111 },
            6: { x: 133 },
            7: { x: 155 },
            8: { x: 177 },
            9: { x: 199 },
            avg: { x: 221, w: 48, h: 25 },
            fps: { x: 271, w: 43, h: 25 },
            max: { x: 316, w: 53, h: 25 },
            min: { x: 371, w: 47, h: 25 },
          },
        },
        fps: '---',
        avgFps: '---',
        minFps: '---',
        maxFps: '---',
      }
    },
    hooks: {
      ready() {
        let minFps = 10000
        let maxFps = 0
        let avgFps = 0
        let totalFps = 0
        let fpsUpdateCounter = 0

        renderer.on('fpsUpdate', (rM, { fps }) => {
          minFps = Math.min(fps, minFps)
          maxFps = Math.max(fps, maxFps)
          totalFps += fps
          fpsUpdateCounter++
          avgFps = Math.round(totalFps / fpsUpdateCounter)

          this.fps = fps.toString().padStart(3, '0')
          this.avgFps = avgFps.toString().padStart(3, '0')
          this.minFps = minFps.toString().padStart(3, '0')
          this.maxFps = maxFps.toString().padStart(3, '0')
        })
      },
    },
  })
