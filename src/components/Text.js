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

import Component from '../component.js'

export default () =>
  Component('Text', {
    template: `
      <Element
        textnode="true"
        :text="$text"
        fontFamily="$font"
        :fontSize="$size"
        :color="$color"
        :style="$style"
        :weight="$weight"
        letterSpacing="$letterspacing"
        stretch="$stretch"
        :w="$w"
        contain="width"
        :textAlign="$align"
      />`,
    props: [
      'content',
      {
        key: 'font',
        default: 'TedNext',
      },
      {
        key: 'size',
        cast: Number,
        default: 32,
      },
      'style',
      'color',
      'weight',
      'letterspacing',
      'stretch',
      'align',
      'w',
    ],
    computed: {
      text() {
        return this.slotcontent || this.content || ''
      },
    },
    hooks: {},
  })
