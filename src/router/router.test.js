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
import { matchHash } from './router.js'

const routes = [
  {
    path: '/',
  },
  {
    path: '/page1',
  },
  {
    path: '/page1/subpage1',
  },
  {
    path: '/tv/:show/seasons/:season',
  },
  {
    path: '/movies/:name',
  },
  {
    path: '/examples/*',
  },
  {
    path: '/route/with/trailing/slash/',
  },
  {
    path: '*',
  },
]

test('Type of matchHash', (assert) => {
  const expected = 'function'
  const actual = typeof matchHash

  assert.equal(actual, expected, 'matchhash should be a function')
  assert.end()
})

test('Match paths with static routes that have an exact match', (assert) => {
  assert.equal(matchHash('/', routes), routes[0], 'Should return the correct route object')
  assert.equal(matchHash('/page1', routes), routes[1], 'Should return the correct route object')
  assert.equal(
    matchHash('/page1/subpage1', routes),
    routes[2],
    'Should return the correct route object'
  )
  assert.end()
})

test('Match paths with dynamic route parts', (assert) => {
  assert.equal(
    matchHash('/tv/simpsons/seasons/first', routes),
    routes[3],
    'Should return the correct route object'
  )

  assert.equal(
    matchHash('/movies/avengers-endgame', routes),
    routes[4],
    'Should return the correct route object'
  )
  assert.end()
})

test('Match paths with a wildcard asterix', (assert) => {
  assert.equal(
    matchHash('/examples/example1', routes),
    routes[5],
    'Should return the correct route object'
  )

  assert.equal(
    matchHash('/examples/example1/subexample/and-another-page', routes),
    routes[5],
    'Should return the correct route object'
  )

  assert.equal(matchHash('/404', routes), routes[7], 'Should return the correct route object')

  assert.equal(
    matchHash('/page1/subpage1/i-dont-exist', routes),
    routes[7],
    'Should return the correct route object'
  )

  assert.end()
})

test('Add params to route for dynamic route matches', (assert) => {
  const match1 = matchHash('/tv/simpsons/seasons/first', routes)

  assert.deepEqual(
    match1.params,
    {
      show: 'simpsons',
      season: 'first',
    },
    'Should return the correct params object'
  )

  const match2 = matchHash('/movies/avengers-endgame', routes)
  assert.deepEqual(
    match2.params,
    {
      name: 'avengers-endgame',
    },
    'Should return the correct route object'
  )

  assert.end()
})

test('Add remaining path as param for wild card routes', (assert) => {
  const match1 = matchHash('/examples/example1', routes)
  assert.deepEqual(match1.params, { path: 'example1' }, 'Should return the correct route object')

  const match2 = matchHash('/examples/example1/subexample/and-another-page', routes)
  assert.deepEqual(
    match2.params,
    { path: 'example1/subexample/and-another-page' },
    'Should return the correct params object'
  )

  const match3 = matchHash('/404', routes)
  assert.deepEqual(match3.params, { path: '404' }, 'Should return the correct params object')

  const match4 = matchHash('/page1/subpage1/i-dont-exist', routes)
  assert.deepEqual(
    match4.params,
    { path: 'page1/subpage1/i-dont-exist' },
    'Should return the correct params object'
  )

  assert.end()
})

test('Work with trailing slashes', (assert) => {
  assert.equal(matchHash('/page1/', routes), routes[1], 'Should return the correct route object')
  assert.equal(
    matchHash('/page1//////', routes),
    routes[1],
    'Should return the correct route object'
  )
  assert.equal(
    matchHash('/page1/subpage1/', routes),
    routes[2],
    'Should return the correct route object'
  )

  assert.equal(
    matchHash('/route/with/trailing/slash', routes),
    routes[6],
    'Should return the correct route object'
  )

  assert.end()
})

test('Work with and without leading slashes', (assert) => {
  assert.equal(matchHash('page1/', routes), routes[1], 'Should return the correct route object')

  assert.equal(matchHash('////page1', routes), routes[1], 'Should return the correct route object')
  assert.equal(
    matchHash('page1/subpage1/', routes),
    routes[2],
    'Should return the correct route object'
  )

  assert.equal(
    matchHash('route/with/trailing/slash', routes),
    routes[6],
    'Should return the correct route object'
  )

  assert.end()
})

test('Match routes case insensitive', (assert) => {
  assert.equal(matchHash('/', routes), routes[0], 'Should return the correct route object')
  assert.equal(matchHash('/Page1', routes), routes[1], 'Should return the correct route object')
  assert.equal(
    matchHash('/pagE1/SUBpage1', routes),
    routes[2],
    'Should return the correct route object'
  )
  assert.equal(
    matchHash('/Tv/SimpsonS/Seasons/First', routes),
    routes[3],
    'Should return the correct route object'
  )

  assert.equal(
    matchHash('/Movies/Avengers-Endgame', routes),
    routes[4],
    'Should return the correct route object'
  )
  assert.end()
})

test('Match routes case insensitive, but pass props with original casing', (assert) => {
  const match1 = matchHash('/Tv/SimpsonS/Seasons/First', routes)
  assert.deepEqual(
    match1.params,
    {
      show: 'SimpsonS',
      season: 'First',
    },
    'Should return the correct params object'
  )

  const match2 = matchHash('/Movies/Avengers-Endgame', routes)
  assert.deepEqual(
    match2.params,
    {
      name: 'Avengers-Endgame',
    },
    'Should return the correct params object'
  )

  assert.end()
})
