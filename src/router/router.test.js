/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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
import { initLog } from '../lib/log.js'
import { matchHash, getHash, to, navigate, back, state } from './router.js'
import { stage } from '../launch.js'
import Component from '../component.js'
import symbols from '../lib/symbols.js'

initLog()

const mockComponents = {
  Home: () => {},
  Page1: () => {},
  SubPage1: () => {},
  Season: () => {},
  Special: () => {},
  Movie: () => {},
  ExampleCatchAll: () => {},
  Slash: () => {},
  DutchMovies: () => {},
  CatchAll: () => {},
}

const routes = [
  {
    path: '/',
    component: mockComponents.Home,
  },
  {
    path: '/page1',
    component: mockComponents.Page1,
  },
  {
    path: '/page1/subpage1',
    component: mockComponents.SubPage1,
  },
  {
    path: '/tv/:show/seasons/:season',
    component: mockComponents.Season,
  },
  {
    path: '/movies/special',
    component: mockComponents.Special,
  },
  {
    path: '/movies/:name',
    component: mockComponents.Movie,
  },
  {
    path: '/examples/*',
    component: mockComponents.ExampleCatchAll,
  },
  {
    path: '/route/with/trailing/slash/',
    component: mockComponents.Slash,
  },
  {
    path: '/dutchmovies/:id',
    component: mockComponents.DutchMovies,
  },
  {
    path: '*',
    component: mockComponents.CatchAll,
  },
]

test('Type of matchHash', (assert) => {
  const expected = 'function'
  const actual = typeof matchHash

  assert.equal(actual, expected, 'matchhash should be a function')
  assert.end()
})

test('Match paths with static routes that have an exact match', (assert) => {
  assert.equal(
    matchHash({ path: '' }, routes).component,
    routes[0].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/' }, routes).component,
    routes[0].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/page1' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/page1/subpage1' }, routes).component,
    routes[2].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/movies/special' }, routes).component,
    routes[4].component,
    'Should return the correct route object'
  )
  assert.end()
})

test('Match paths with dynamic route parts', (assert) => {
  assert.equal(
    matchHash({ path: '/tv/simpsons/seasons/first' }, routes).component,
    routes[3].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/tv/simpsons/season/first' }, routes).component,
    routes[9].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/examples/test/seasons/5' }, routes).component,
    routes[6].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/movies/avengers-endgame' }, routes).component,
    routes[5].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/movies/special-1' }, routes).component,
    routes[5].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/dutchmovies/123' }, routes).component,
    routes[8].component,
    'Should return the correct route object'
  )

  assert.end()
})

test('Match paths with a wildcard asterix', (assert) => {
  assert.equal(
    matchHash({ path: '/examples/example1' }, routes).component,
    routes[6].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/examples/example1/subexample/and-another-page' }, routes).component,
    routes[6].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/404' }, routes).component,
    routes[9].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/page1/non-existing-path' }, routes).component,
    routes[9].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/page1/subpage1/i-dont-exist' }, routes).component,
    routes[9].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/completely/unexpected/route' }, routes).component,
    routes[9].component,
    'Should return the correct route object'
  )

  assert.end()
})

test('Add params to route for dynamic route matches', (assert) => {
  const match1 = matchHash({ path: '/tv/simpsons/seasons/first' }, routes)

  assert.deepEqual(
    match1.params,
    {
      show: 'simpsons',
      season: 'first',
    },
    'Should return the correct params object'
  )

  const match2 = matchHash({ path: '/movies/avengers-endgame' }, routes)
  assert.deepEqual(
    match2.params,
    {
      name: 'avengers-endgame',
    },
    'Should return the correct route object'
  )

  const match3 = matchHash({ path: '/dutchmovies/1' }, routes)
  assert.deepEqual(
    match3.params,
    {
      id: '1',
    },
    'Should return the correct route object'
  )

  assert.end()
})

test('Add remaining path as param for wild card routes', (assert) => {
  const match1 = matchHash({ path: '/examples/example1' }, routes)
  assert.deepEqual(match1.params, { path: 'example1' }, 'Should return the correct route object')

  const match2 = matchHash({ path: '/examples/example1/subexample/and-another-page' }, routes)
  assert.deepEqual(
    match2.params,
    { path: 'example1/subexample/and-another-page' },
    'Should return the correct params object'
  )

  const match3 = matchHash({ path: '/404' }, routes)
  assert.deepEqual(match3.params, { path: '404' }, 'Should return the correct params object')

  const match4 = matchHash({ path: '/page1/subpage1/i-dont-exist' }, routes)
  assert.deepEqual(
    match4.params,
    { path: 'page1/subpage1/i-dont-exist' },
    'Should return the correct params object'
  )

  assert.end()
})

test('Work with trailing slashes', (assert) => {
  assert.equal(
    matchHash({ path: '/page1/' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/page1//////' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/page1/subpage1/' }, routes).component,
    routes[2].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/route/with/trailing/slash' }, routes).component,
    routes[7].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/tv/simpsons/seasons/first' }, routes).component,
    routes[3].component,
    'Should return the correct route object'
  )

  assert.end()
})

test('Work with and without leading slashes', (assert) => {
  assert.equal(
    matchHash({ path: 'page1/' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '////page1' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: 'page1/subpage1/' }, routes).component,
    routes[2].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: 'route/with/trailing/slash' }, routes).component,
    routes[7].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '//tv/simpsons/seasons/first//' }, routes).component,
    routes[3].component,
    'Should return the correct route object'
  )

  assert.end()
})

test('Match routes case insensitive', (assert) => {
  assert.equal(
    matchHash({ path: '/' }, routes).component,
    routes[0].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/Page1' }, routes).component,
    routes[1].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/pagE1/SUBpage1' }, routes).component,
    routes[2].component,
    'Should return the correct route object'
  )
  assert.equal(
    matchHash({ path: '/Tv/SimpsonS/Seasons/First' }, routes).component,
    routes[3].component,
    'Should return the correct route object'
  )

  assert.equal(
    matchHash({ path: '/Movies/Avengers-Endgame' }, routes).component,
    routes[5].component,
    'Should return the correct route object'
  )
  assert.end()
})

test('Match routes case insensitive, but pass props with original casing', (assert) => {
  const match1 = matchHash({ path: '/Tv/SimpsonS/Seasons/First' }, routes)
  assert.deepEqual(
    match1.params,
    {
      show: 'SimpsonS',
      season: 'First',
    },
    'Should return the correct params object'
  )

  const match2 = matchHash({ path: '/Movies/Avengers-Endgame' }, routes)
  assert.deepEqual(
    match2.params,
    {
      name: 'Avengers-Endgame',
    },
    'Should return the correct params object'
  )

  const match3 = matchHash({ path: '/DutchMovies/ID_123' }, routes)
  assert.deepEqual(
    match3.params,
    {
      id: 'ID_123',
    },
    'Should return the correct params object'
  )

  assert.end()
})

test('Match paths with dynamic route parts along with query string params', (assert) => {
  const hash1 = '#/tv/simpsons/seasons/first?token=123&ln=en'

  const { hash, path, queryParams } = getHash(hash1)

  assert.equal(hash, hash1, 'Should return correct hash')
  assert.equal(path, '/tv/simpsons/seasons/first', 'Should return the correct route path')
  assert.equal(
    matchHash({ path: path }, routes).component,
    routes[3].component,
    'Should return the correct route object'
  )
  assert.equal(
    queryParams.get('token'),
    '123',
    'Should contain the correct query parameter key with value'
  )
  assert.equal(
    queryParams.get('ln'),
    'en',
    'Should contain the correct query parameter key with value'
  )
  assert.end()
})

test('Get the hash from the URL', (assert) => {
  const hash = '#/movies/action/the-avengers'

  const result = getHash(hash)

  assert.equal(
    result.hash,
    hash,
    'The result object should contain a hash key with the correct location hash'
  )

  assert.equal(
    result.path,
    '/movies/action/the-avengers',
    'The result object should contain a path key with the hash (stripped the # symbol)'
  )

  assert.end()
})

test('Get the hash from the URL and handle query params', (assert) => {
  const hash = '#/movies/comedy/the-hangover?category=1&item=2'

  const result = getHash(hash)

  assert.equal(
    result.hash,
    hash,
    'The result object should contain a hash key with the correct location hash without the query params'
  )

  assert.equal(
    result.path,
    '/movies/comedy/the-hangover',
    'The result object should contain a path key with the hash (stripped the # symbol)'
  )

  assert.equal(
    result.queryParams instanceof URLSearchParams,
    true,
    'The result object should contain a queryParams key with an URLSearchParams object'
  )

  assert.equal(
    result.queryParams.get('category'),
    '1',
    'The result object should contain a queryParams key with the correct route query param values'
  )

  assert.equal(
    result.queryParams.get('item'),
    '2',
    'The result object should contain a queryParams key with the correct route query param values'
  )

  assert.end()
})

test('Get route object from Match hash when navigating using to() method', (assert) => {
  const hash = '/page1/subpage1'

  to(hash)

  const result = matchHash({ path: hash }, routes)

  assert.equal(
    result.path,
    '/page1/subpage1',
    'The result object should contain a path key with path hash'
  )
  assert.equal(
    Object.keys(result.params).length,
    0,
    'The results object should contain a params key with zero props'
  )
  assert.equal(
    Object.keys(result.data).length,
    0,
    'The results object should contain a data key with zero props'
  )
  assert.equal(
    Object.keys(result.options).length,
    4,
    'The results object should contain the default options object'
  )

  assert.deepEqual(
    Object.entries(result.options),
    [
      ['inHistory', true],
      ['keepAlive', false],
      ['passFocus', true],
      ['reuseComponent', false],
    ],
    'The results object should contain the default options object'
  )
  assert.end()
})

test('Get route object from Match hash when navigating using to() method with options', (assert) => {
  const hash = '/page1/subpage1'

  to(hash, undefined, { keepAlive: true })

  const result = matchHash({ path: hash }, routes)

  assert.equal(
    result.path,
    '/page1/subpage1',
    'The result object should contain a path key with path hash'
  )

  assert.equal(
    result.options.keepAlive,
    true,
    'The results object should contain a options key with keep alive as True'
  )

  assert.end()
})

test('Get Hash from URL when navigating using to() method', (assert) => {
  const hash = '#/movies/action/avengers'

  const result = getHash(hash)

  assert.equal(
    result.hash,
    hash,
    'The result object key property should contain correct location hash'
  )

  assert.equal(
    result.path,
    '/movies/action/avengers',
    'The result object should contain a path key with hash without #'
  )

  assert.end()
})

test('Router updates state.path, state.params, and state.data correctly', async (assert) => {
  // Stub stage.element to avoid engine dependency
  const originalElement = stage.element
  stage.element = ({ parent }) => ({
    populate() {},
    set() {},
    parent,
  })

  const Capturing = Component('Capturing', {
    template: '<Element />',
    code: {
      render: () => ({
        elms: [
          {
            [symbols.holder]: {},
            node: {},
          },
        ],
        cleanup: () => {},
      }),
      effects: [],
      init() {
        // just to prove component is constructed
        this.$router && assert.ok(true, 'Component accessed $router')
      },
    },
  })

  const host = {
    [symbols.parent]: {
      [symbols.routes]: [
        {
          path: '/cap/:id',
          component: Capturing,
          options: { inHistory: true, passFocus: false },
          data: { title: 'Test' },
        },
      ],
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  // Navigate
  to('/cap/123?lang=en', { dynamic: true })
  await navigate.call(host)

  // Assertions directly against router.js `state`
  assert.equal(state.path, '/cap/:id', 'state.path matches route definition')
  assert.deepEqual(state.params, { id: '123' }, 'state.params extracted correctly')
  assert.deepEqual(
    state.data,
    { title: 'Test', dynamic: true, lang: 'en' },
    'state.data merged correctly (route + navigation + query)'
  )

  // Restore
  stage.element = originalElement
  assert.end()
})

test('Router.back() pops history and navigates to previous route', async (assert) => {
  const originalElement = stage.element

  stage.element = ({ parent }) => ({
    populate() {},
    set(prop, value) {
      if (value && value.transition && typeof value.transition.end === 'function') {
        value.transition.end()
      }
    },
    destroy() {},
    parent,
  })

  const TestComponent = Component('TestComponent', {
    template: '<Element />',
    code: { render: () => ({ elms: [], cleanup: () => {} }), effects: [] },
  })

  const host = {
    [symbols.parent]: {
      [symbols.routes]: [
        {
          path: '/first',
          component: TestComponent,
          options: { inHistory: true, passFocus: false },
        },
        {
          path: '/second',
          component: TestComponent,
          options: { inHistory: true, passFocus: false },
        },
      ],
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  to('/first')
  await navigate.call(host)
  to('/second')
  await navigate.call(host)

  assert.equal(state.path, '/second', 'Should be on second route before back')
  assert.equal(back.call(host), true, 'back() should return true when history has previous route')
  assert.ok(window.location.hash.includes('first'), 'Should set hash to previous route')

  stage.element = originalElement
  assert.end()
})

test('Transition out with end callback is invoked on navigate away', async (assert) => {
  const originalElement = stage.element

  let endCalled = false
  stage.element = ({ parent }) => ({
    populate() {},
    set(prop, value) {
      if (value && value.transition && typeof value.transition.end === 'function') {
        value.transition.end()
      }
    },
    destroy() {},
    parent,
  })

  const TestComponent = Component('TestComponent', {
    template: '<Element />',
    code: { render: () => ({ elms: [], cleanup: () => {} }), effects: [] },
  })

  const host = {
    [symbols.parent]: {
      [symbols.routes]: [
        {
          path: '/from',
          component: TestComponent,
          options: { inHistory: true, passFocus: false },
          transition: {
            in: { prop: 'alpha', value: 1 },
            out: {
              prop: 'alpha',
              value: 0,
              end() {
                endCalled = true
              },
            },
          },
        },
        { path: '/to', component: TestComponent, options: { inHistory: true, passFocus: false } },
      ],
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  to('/from')
  await navigate.call(host)
  to('/to')
  await navigate.call(host)

  assert.ok(endCalled, 'Should call transition.out.end when navigating away')
  stage.element = originalElement
  assert.end()
})

test('Navigate to unknown path calls routerHooks.error', async (assert) => {
  let errorMsg
  const host = {
    [symbols.parent]: {
      [symbols.routes]: [{ path: '/known', component: mockComponents.Home }],
      [symbols.routerHooks]: {
        error(msg) {
          errorMsg = msg
        },
      },
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  to('/unknown')
  await navigate.call(host)

  assert.ok(errorMsg != null, 'Error hook should be called with a message')
  assert.ok(String(errorMsg).includes('not found'), 'Error message should indicate not found')
  assert.equal(state.navigating, false, 'Should reset state.navigating after navigate completes')
  assert.end()
})

test('Before hook route object redirect', async (assert) => {
  const originalElement = stage.element
  stage.element = ({ parent }) => ({ populate() {}, set() {}, parent })

  const TestComponent = Component('TestComponent', {
    template: '<Element />',
    code: { render: () => ({ elms: [], cleanup: () => {} }), effects: [] },
  })

  const host = {
    [symbols.parent]: {
      [symbols.routes]: [
        {
          path: '/original',
          component: TestComponent,
          hooks: {
            before() {
              return { path: '/redirected', component: TestComponent }
            },
          },
        },
        { path: '/redirected', component: TestComponent },
      ],
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  to('/original')
  await navigate.call(host)
  assert.equal(window.location.hash, '#/redirected', 'Should redirect to new path')
  stage.element = originalElement
  assert.end()
})

test('BeforeEach hook route object redirect', async (assert) => {
  const originalElement = stage.element
  stage.element = ({ parent }) => ({ populate() {}, set() {}, parent })

  const TestComponent = Component('TestComponent', {
    template: '<Element />',
    code: { render: () => ({ elms: [], cleanup: () => {} }), effects: [] },
  })

  const host = {
    [symbols.parent]: {
      [symbols.routes]: [
        { path: '/original', component: TestComponent },
        { path: '/redirected', component: TestComponent },
      ],
      [symbols.routerHooks]: {
        beforeEach() {
          return { path: '/redirected', component: TestComponent }
        },
      },
    },
    [symbols.children]: [{}],
    [symbols.props]: {},
  }

  to('/original')
  await navigate.call(host)
  assert.equal(window.location.hash, '#/redirected', 'Should redirect via beforeEach hook')
  stage.element = originalElement
  assert.end()
})

test('Route meta data is accessible in route object', async (assert) => {
  const route = { path: '/test', meta: { auth: true, role: 'admin' } }
  assert.deepEqual(
    route.meta,
    { auth: true, role: 'admin' },
    'Should have access to route meta data'
  )
  assert.end()
})
