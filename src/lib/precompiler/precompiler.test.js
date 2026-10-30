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

import test from 'tape'
import precompile from './precompiler.js'

const hoverMetadata = (body) => {
  const source =
    "Blits.Component('Example', { template: `<Element />`, methods: { check() { " + body + ' } } })'
  return precompile(source, 'Example.js', 'production').code.includes('usesHoverState: true')
}

test('Precompiler - comment delimiters in strings preserve later hover references', (assert) => {
  for (const literal of [
    "'https://example.com'",
    '"https://example.com"',
    '`https://example.com`',
    "'/* not a comment */'",
    "'/*'",
    String.raw`'it\'s https://example.com'`,
    String.raw`"escaped \" https://example.com"`,
  ]) {
    assert.equal(hoverMetadata(`const value = ${literal}; return this.$isHovered`), true, literal)
  }
  assert.equal(
    hoverMetadata('return `https://example.com/${this.$isHovered}`'),
    true,
    'template interpolation remains detectable'
  )
  assert.end()
})

test('Precompiler - actual comments do not enable hover metadata', (assert) => {
  for (const body of [
    '// this.$isHovered\nreturn false',
    '/* this.$isHovered */ return false',
    "const url = 'https://example.com'; // this.$isHovered\nreturn false",
    "/* 'unterminated quote this.$isHovered */ return false",
    '// "unterminated quote this.$isHovered\nreturn false',
  ]) {
    assert.equal(hoverMetadata(body), false, body)
  }
  assert.equal(
    hoverMetadata('/* ignored */ return this.$isHovered'),
    true,
    'real reference after comment is preserved'
  )
  assert.end()
})
