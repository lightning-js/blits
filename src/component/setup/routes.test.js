import { test } from 'tap'
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
  assert.same(
    component[symbols.routes][0].options,
    { inHistory: true },
    'Should apply default options when none specified'
  )
  assert.same(
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
