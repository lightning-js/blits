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
import Settings from '../settings.js'

export default () =>
  Component('Text', {
    template: `
      <Element
        __textnode="true"
        :text="$content"
        fontFamily="$font"
        :fontSize="$size"
        :color="$color"
        :style="$style"
        :weight="$weight"
        letterSpacing="$letterspacing"
        lineHeight="$_lineheight"
        stretch="$stretch"
        contain="$_contain"
        :wordWrap="$wordwrap"
        :maxLines="$maxlines"
        :textAlign="$align"
        :overflowSuffix="$textoverflow"
        @loaded="$@loaded"
        @error="$@error"
      />`,
    props: [
      'content',
      {
        key: 'font',
        default: Settings.get('defaultFont', 'lato'),
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
      'wordwrap',
      'maxlines',
      'lineheight',
      'contain',
      '@loaded',
      '@error',
      'textoverflow',
    ],
    computed: {
      _contain() {
        return (
          this.contain ||
          (this.wordwrap && this.maxlines ? 'both' : this.wordwrap ? 'width' : 'none')
        )
      },
      _lineheight() {
        return this.lineheight !== undefined ? this.lineheight : this.size
      },
    },
  })
