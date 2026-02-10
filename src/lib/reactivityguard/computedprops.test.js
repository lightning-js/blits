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
import processComputedProps from './computedprops.js'

const countOccurrences = (haystack, needle) => {
  return (haystack.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [])
    .length
}

test('Skips comments and processes computed methods', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        a() { return this.foo },
        // b() { return this.bar },
        /* c() { return this.baz }, */
        d() { return this.qux },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw with comments')
  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.equal(
    countOccurrences(out, 'auto-generated reactivity guard'),
    2,
    'processes methods, skips comments'
  )
  assert.end()
})

test('Deterministic replacements for identical computed methods', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        a() { return this.foo },
        a() { return this.foo },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw for duplicates')
  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.equal(
    countOccurrences(out, 'auto-generated reactivity guard'),
    2,
    'processes both identical methods'
  )
  assert.end()
})

test('Does not process non-method computed syntaxes', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        a() { return this.foo },
        arrow: () => this.foo,
        fn: function () { return this.foo },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw for mixed syntaxes')
  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.equal(
    countOccurrences(out, 'auto-generated reactivity guard'),
    1,
    'only processes method shorthand'
  )
  assert.end()
})
