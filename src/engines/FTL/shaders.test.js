/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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
import { initLog } from '../../lib/log.js'
import {
  setShaderModules,
  setStage,
  colorToFtl,
  parseRoundedValue,
  parseBorderValue,
  parseShadowValue,
  parseGradientColor,
  buildElementShader,
  buildCustomShader,
  createShaderInstance,
  assignShader,
} from './shaders.js'

initLog()

const mockModules = () => {
  const created = []
  const mods = {
    createShader: (mod) => {
      const instance = { __module: mod.__key, id: created.length }
      created.push(instance)
      return instance
    },
  }
  for (const key of [
    'RoundedShader',
    'BorderShader',
    'ShadowShader',
    'RoundedWithBorderShader',
    'RoundedWithShadowShader',
    'RoundedWithBorderAndShadowShader',
    'LinearGradientShader',
    'RadialGradientShader',
    'HolePunchShader',
  ]) {
    mods[key] = { __key: key }
  }
  return { mods, created }
}

const mockElement = (overrides = {}) => ({
  shader: null,
  _bucketRenderType: undefined,
  dirtied: 0,
  dirty() {
    this.dirtied++
  },
  ...overrides,
})

test('shaders - colorToFtl', (assert) => {
  assert.deepEqual(colorToFtl('#ff0000'), [1, 0, 0, 1], 'hex red')
  assert.deepEqual(colorToFtl('white'), [1, 1, 1, 1], 'named white')
  assert.deepEqual(colorToFtl('#00000000'), [0, 0, 0, 0], 'transparent')
  assert.deepEqual(colorToFtl('0x00ff00ff'), [0, 1, 0, 1], 'normalized form passes through')
  assert.end()
})

test('shaders - parseRoundedValue', (assert) => {
  assert.equal(parseRoundedValue(20), 20, 'number')
  assert.equal(parseRoundedValue('20'), 20, 'numeric string')
  assert.deepEqual(parseRoundedValue('[25, 50]'), [25, 50], 'array string')
  assert.deepEqual(parseRoundedValue([20, 20, 0, 0]), [20, 20, 0, 0], 'array')
  assert.equal(parseRoundedValue(undefined), null, 'undefined -> null')
  assert.end()
})

test('shaders - parseBorderValue', (assert) => {
  assert.deepEqual(parseBorderValue(20), { width: 20 }, 'scalar')
  assert.deepEqual(parseBorderValue('20'), { width: 20 }, 'scalar string')
  assert.deepEqual(parseBorderValue([4, 4, 4, 4]), { width: [4, 4, 4, 4] }, 'array')
  const parsed = parseBorderValue({ w: 10, color: 'white' })
  assert.equal(parsed.width, 10, 'object w')
  assert.deepEqual(parsed.color, [1, 1, 1, 1], 'object color normalized')
  assert.end()
})

test('shaders - parseShadowValue', (assert) => {
  assert.deepEqual(parseShadowValue([1, 2, 3, 4]), { projection: [1, 2, 3, 4] }, 'array')
  const fromKeys = parseShadowValue({ color: 'pink', blur: 10 })
  assert.deepEqual(fromKeys.projection, [0, 0, 10, 5], 'keys patch L3-base projection')
  assert.ok(Array.isArray(fromKeys.color) && fromKeys.color.length === 4, 'color normalized')
  const direct = parseShadowValue({ projection: [1, 1, 1, 1], color: '#000000' })
  assert.deepEqual(direct.projection, [1, 1, 1, 1], 'direct projection passes through')
  assert.end()
})

test('shaders - buildElementShader combo matrix', (assert) => {
  assert.deepEqual(
    buildElementShader({ rounded: 10, border: undefined, shadow: undefined }),
    { kind: 'rounded', fields: { radius: 10 } },
    'rounded only'
  )
  assert.deepEqual(
    buildElementShader({
      rounded: undefined,
      border: { w: 10, color: 'white' },
      shadow: undefined,
    }),
    { kind: 'border', fields: { width: 10, color: [1, 1, 1, 1] } },
    'border only renames w->width'
  )
  const rb = buildElementShader({ rounded: 10, border: 20, shadow: undefined })
  assert.equal(rb.kind, 'roundedWithBorder', 'rounded+border combo')
  assert.equal(rb.fields.radius, 10, 'radius kept')
  assert.equal(rb.fields.borderWidth, 20, 'scalar border width')

  const bs = buildElementShader({
    rounded: undefined,
    border: { w: 20, color: 'green' },
    shadow: { color: 'pink' },
  })
  assert.equal(bs.kind, 'roundedWithBorderAndShadow', 'border+shadow uses triple combo (L3 parity)')
  assert.equal(bs.fields.radius, 0, 'radius 0 when unrounded')
  assert.deepEqual(bs.fields.borderColor, [0, 128 / 255, 0, 1], 'green (#008000) normalized')

  const all = buildElementShader({ rounded: 5, border: { w: 2 }, shadow: [0, 0, 4, 4] })
  assert.equal(all.kind, 'roundedWithBorderAndShadow', 'triple combo')
  assert.deepEqual(all.fields.shadow, [0, 0, 4, 4], 'shadow projection passed')

  assert.equal(
    buildElementShader({ rounded: undefined, border: undefined, shadow: undefined }),
    null,
    'no effects -> null'
  )
  assert.end()
})

test('shaders - parseGradientColor', (assert) => {
  const vertical = parseGradientColor({ top: '#0891b2', bottom: '#a5f3fc' })
  assert.equal(vertical.colors.length, 2, 'two colors')
  assert.deepEqual(vertical.stops, [0, 1], 'even stops')
  assert.ok(Math.abs(vertical.angle - 0) < 1e-9, 'top->bottom is angle 0 (FTL geometry)')

  const horizontal = parseGradientColor({ left: '#dc2626', right: '#f87171' })
  assert.ok(
    Math.abs(horizontal.angle - (3 * Math.PI) / 2) < 1e-9,
    'left->right is angle 3PI/2 (FTL geometry)'
  )

  const single = parseGradientColor({ top: '#ff0000' })
  assert.deepEqual(single.solid, [1, 0, 0, 1], 'single key degrades to solid')

  assert.equal(parseGradientColor({}), null, 'no known keys -> null')
  assert.end()
})

test('shaders - buildCustomShader dispatch', (assert) => {
  const linear = buildCustomShader({
    type: 'linearGradient',
    colors: ['#000000', '#ffffff'],
    angle: 1,
  })
  assert.equal(linear.kind, 'linearGradient', 'linearGradient dispatches')
  assert.deepEqual(linear.fields.stops, [0, 1], 'stops defaulted evenly')
  assert.equal(linear.fields.angle, 1, 'angle passes through untranslated')

  const hole = buildCustomShader({ type: 'holePunch', x: 100, y: 200, width: 100, height: 100 })
  assert.equal(hole.kind, 'holePunch', 'holePunch dispatches')
  assert.equal(hole.fields.w, 100, 'width alias -> w')
  assert.equal(hole.fields.h, 100, 'height alias -> h')

  assert.equal(buildCustomShader({ type: 'rhombus' }), null, 'custom type -> null + warn')
  assert.equal(buildCustomShader('rhombus'), null, 'string form handled by element layer')
  assert.end()
})

test('shaders - createShaderInstance needs injected modules', (assert) => {
  setShaderModules(null)
  assert.throws(
    () => createShaderInstance({ kind: 'rounded', fields: { radius: 1 } }),
    /not injected/,
    'loud error without modules'
  )
  assert.equal(createShaderInstance(null), null, 'null desc -> null')

  const { mods } = mockModules()
  setShaderModules(mods)
  const instance = createShaderInstance({ kind: 'rounded', fields: { radius: 12 } })
  assert.equal(instance.__module, 'RoundedShader', 'right module')
  assert.equal(instance.radius, 12, 'fields assigned')
  assert.equal(createShaderInstance({ kind: 'nope', fields: {} }), null, 'unknown kind -> null')
  assert.end()
})

test('shaders - assignShader re-buckets on null<->set switches', (assert) => {
  const { mods } = mockModules()
  setShaderModules(mods)
  const calls = []
  setStage({
    removeFromZIndex: (el) => calls.push(['remove', el]),
    addToZIndex: (el) => calls.push(['add', el]),
  })

  // Never bucketed: plain assign (first resolveDirty pass buckets correctly).
  const fresh = mockElement()
  const inst = createShaderInstance({ kind: 'rounded', fields: { radius: 5 } })
  assignShader(fresh, inst)
  assert.equal(fresh.shader, inst, 'instance assigned')
  assert.deepEqual(calls, [], 'no re-bucket before first bucketing')
  assert.equal(fresh.dirtied, 1, 'dirtied')

  // Bucketed plain -> shader: remove + add.
  const el = mockElement({ _bucketRenderType: 0 })
  assignShader(el, inst)
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['remove', 'add'],
    're-bucketed on null->set'
  )

  // Shader -> shader: same bucket, plain assign.
  calls.length = 0
  const inst2 = createShaderInstance({ kind: 'border', fields: {} })
  assignShader(el, inst2)
  assert.equal(el.shader, inst2, 'instance replaced')
  assert.deepEqual(calls, [], 'no re-bucket on type switch')

  // Shader -> null: remove + add.
  assignShader(el, null)
  assert.equal(el.shader, null, 'shader cleared')
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['remove', 'add'],
    're-bucketed on set->null'
  )
  setStage(null)
  assert.end()
})
