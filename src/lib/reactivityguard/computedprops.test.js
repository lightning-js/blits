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

test('Does not duplicate guards when processing output twice', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        height() {
          return this.h - ((this.children[this.focusIndex] && this.children[this.focusIndex].y) || 0) + 64
        },
      }
    })
  `

  const pass1 = processComputedProps(input)
  assert.ok(pass1, 'first pass should inject guards')
  assert.equal(
    countOccurrences(pass1.code, 'auto-generated reactivity guard'),
    1,
    'first pass: one guard comment'
  )

  const pass2 = processComputedProps(pass1.code)
  assert.equal(pass2, null, 'second pass should return null (no changes)')

  assert.end()
})

test('Does not duplicate guards when guard comment is stripped', (assert) => {
  // Simulates what happens when esbuild strips the guard comment
  // but leaves the this.X; statements intact
  const alreadyGuarded = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        height() {
          this.h;
          this.children;
          this.focusIndex;
          return this.h - ((this.children[this.focusIndex] && this.children[this.focusIndex].y) || 0) + 64
        },
      }
    })
  `

  const result = processComputedProps(alreadyGuarded)
  assert.equal(result, null, 'should return null when guards already present (no comment)')

  assert.end()
})

test('Guards full property chain for nested reactive references', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        showContent() {
          const isActive = this.item.tags?.some(tag => tag.id === 1);
          return isActive && !this.$appState.ui.sidebar;
        },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw')
  const result = processComputedProps(input)
  assert.ok(result, 'injects guards')
  const out = result.code
  assert.ok(
    out.includes('this.$appState && this.$appState.ui && this.$appState.ui.sidebar;'),
    'guards full chain with &&'
  )
  assert.ok(out.includes('this.item && this.item.tags;'), 'stops chain before method call')
  assert.notOk(out.includes('this.$appState;'), 'no standalone this.$appState guard')
  assert.notOk(out.includes('this.item;'), 'no standalone this.item guard')
  assert.end()
})

test('Guards deep chain with && when intermediate values can be null', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        posterUrl() {
          if (!this.media) return null
          return this.media.poster.src
        },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw')
  const result = processComputedProps(input)
  assert.ok(result, 'injects guards')
  const out = result.code
  assert.ok(
    out.includes('this.media && this.media.poster && this.media.poster.src;'),
    'injects full && chain'
  )
  assert.end()
})

test('Does not duplicate guards when && guard comment is stripped', (assert) => {
  const alreadyGuarded = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        posterUrl() {
          this.media && this.media.poster && this.media.poster.src;
          if (!this.media) return null
          return this.media.poster.src
        },
      }
    })
  `

  const result = processComputedProps(alreadyGuarded)
  assert.equal(result, null, 'should return null when && guard already present')
  assert.end()
})

test('Single-level ref guard has no && chain', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        label() {
          return this.title || 'fallback'
        },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw')
  const result = processComputedProps(input)
  assert.ok(result, 'injects guards')
  const out = result.code
  assert.ok(out.includes('this.title;'), 'single-level ref injected as-is')
  assert.notOk(out.includes('&&'), 'no && for single-level ref')
  assert.end()
})

test('Guards long-form function() alongside method shorthand, skips arrow', (assert) => {
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
    2,
    'guards both shorthand method and long-form function()'
  )
  assert.end()
})

test('Guards $appState chain with method call in computed (regression)', (assert) => {
  // Reproduces the displayMatchAlerts / $appState reactivity issue
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('MatchAlerts', {
      computed: {
        displayMatchAlerts() {
          return this.$appState.match.alerts.filter(a => a.active)
        },
      }
    })
  `

  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(
    out.includes('this.$appState && this.$appState.match && this.$appState.match.alerts;'),
    'hoists $appState.match.alerts chain, stops before .filter()'
  )
  assert.notOk(out.includes('this.$appState;'), 'no standalone $appState guard')
  assert.end()
})

test('Skips arrow member, guards long-form function() and method shorthand around it', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        arrow: () => this.x,
        fn: function() { return this.y },
        valid() { return this.z },
      }
    })
  `

  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(out.includes('this.z;'), 'guards method shorthand after non-method members')
  assert.ok(out.includes('this.y;'), 'guards long-form function() member')
  assert.equal(countOccurrences(out, 'auto-generated reactivity guard'), 2, 'two guards')
  assert.end()
})

test('Guards deep this.* chain in long-form function() computed prop', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        deepFunction: function () {
          return this.deep.nested.value
        },
      }
    })
  `

  const result = processComputedProps(input)
  assert.ok(result, 'injects guards')
  const out = result.code
  assert.ok(
    out.includes('this.deep && this.deep.nested && this.deep.nested.value;'),
    'guards full chain with &&'
  )
  assert.end()
})

test('Matches long-form function() with extra whitespace/newlines before the body', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        spaced:    function  (  )

        {
          return this.value
        },
      }
    })
  `

  const result = processComputedProps(input)
  assert.ok(result, 'injects guards')
  const out = result.code
  assert.ok(out.includes('this.value;'), 'guards this.value despite extra whitespace/newlines')
  assert.end()
})

test('Parses config with deeply nested braces without breaking', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      props: ['items'],
      state() {
        return { nested: { a: { b: 1 } }, count: 0 }
      },
      computed: {
        total() { return this.count + this.nested.a.b },
      },
      hooks: {
        ready() { console.log('ready') }
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw with nested braces')
  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(out.includes('this.nested && this.nested.a && this.nested.a.b;'), 'guards nested chain')
  assert.end()
})

test('Processes multiple computed props with mixed chain depths', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        simple() { return this.x },
        deep() { return this.a.b.c.d },
        mixed() { return this.foo + this.bar.baz },
      }
    })
  `

  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(out.includes('this.x;'), 'single-level guard')
  assert.ok(out.includes('this.a && this.a.b && this.a.b.c && this.a.b.c.d;'), 'deep chain guard')
  assert.ok(out.includes('this.bar && this.bar.baz;'), 'two-level chain guard')
  assert.equal(countOccurrences(out, 'auto-generated reactivity guard'), 3, 'one guard per prop')
  assert.end()
})

test('Guards this refs in complex expressions', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        display() { return this.isActive ? this.activeLabel : this.inactiveLabel },
        greeting() { return \`Hello \${this.firstName} \${this.lastName}\` },
      }
    })
  `

  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(out.includes('this.isActive;'), 'guards ternary condition')
  assert.ok(out.includes('this.firstName;'), 'guards template literal ref')
  assert.equal(countOccurrences(out, 'auto-generated reactivity guard'), 2, 'one guard per prop')
  assert.end()
})

test('Correctly parses function body with braces inside strings', (assert) => {
  const input = `
    import Blits from '@lightningjs/blits'
    export default Blits.Component('C', {
      computed: {
        formatted() { return '{' + this.value + '}' },
      }
    })
  `

  assert.doesNotThrow(() => processComputedProps(input), 'should not throw with braces in strings')
  const result = processComputedProps(input)
  const out = result !== null ? result.code : input
  assert.ok(out.includes('this.value;'), 'guards this.value')
  assert.end()
})
