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

export default () =>
  Component('Text', {
    template: `
      <Element
        __textnode="true"
        :text="$text"
        fontFamily="$font"
        :fontSize="$size"
        :color="$color"
        :style="$style"
        :weight="$weight"
        letterSpacing="$letterspacing"
        stretch="$stretch"
        contain="$_contain"
        :w="$w"
        :textAlign="$align"
        @loaded="$@loaded"
        @error="$@error"
      />`,
    props: [
      'content',
      {
        key: 'font',
        default: 'lato',
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
      'contain',
      '@loaded',
      '@error',
    ],
    computed: {
      text() {
        return (
          this.slotcontent ||
          this.content ||
          (this.slotcontent === 0 ? this.slotcontent : this.content === 0 ? this.content : '')
        )
      },
      _contain() {
        return this.contain || (this.align ? 'width' : null)
      },
    },
  })
