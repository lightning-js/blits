/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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
import routes from './routes.js'
import symbols from '../../lib/symbols.js'

test('Type', (assert) => {
  const expected = 'function'
  const actual = typeof routes

  assert.equal(actual, expected, 'routes should be a function')
  assert.end()
})

test('Array routes with default options', (assert) => {
  const component = {}
  const routeData = [
    { path: '/home', component: 'Home' },
    { path: '/about', component: 'About', options: { inHistory: false } },
  ]

  routes(component, routeData)

  assert.equal(component[symbols.routes].length, 2, 'Should set correct number of routes')
  assert.deepEqual(
    component[symbols.routes][0].options,
    { inHistory: true },
    'Should apply default options when none specified'
  )
  assert.deepEqual(
    component[symbols.routes][1].options,
    { inHistory: false },
    'Should override default options when specified'
  )
  assert.end()
})

test('Object routes with hooks', (assert) => {
  const component = {}
  const mockHooks = { beforeEach: () => {}, afterEach: () => {} }
  const routeData = {
    hooks: mockHooks,
    routes: [{ path: '/profile', component: 'Profile' }],
  }

  routes(component, routeData)

  assert.equal(component[symbols.routerHooks], mockHooks, 'Should set router hooks')
  assert.equal(component[symbols.routes].length, 1, 'Should set routes from object data')
  assert.equal(component[symbols.routes][0].path, '/profile', 'Should set correct route path')
  assert.end()
})

test('Empty routes array', (assert) => {
  const component = {}
  const routeData = []

  routes(component, routeData)

  assert.ok(Array.isArray(component[symbols.routes]), 'Should initialize routes as array')
  assert.equal(component[symbols.routes].length, 0, 'Should handle empty routes array')
  assert.end()
})
