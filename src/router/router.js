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

import { default as fadeInFadeOutTransition } from './transitions/fadeInOut.js'
import { reactive } from '../lib/reactivity/reactive.js'

import symbols from '../lib/symbols.js'
import { Log } from '../lib/log.js'
import { stage } from '../launch.js'
import Focus from '../focus.js'
import Announcer from '../announcer/announcer.js'
import Settings from '../settings.js'

/**
 * @typedef {import('../component.js').BlitsComponentFactory} BlitsComponentFactory - The component of the route
 * @typedef {import('../component.js').BlitsComponent} BlitsComponent - The element of the route
 * @typedef {import('../engines/L3/element.js').BlitsElement} BlitsElement - The element of the route
 *
 * @typedef {Object} Route
 * @property {string} path - The path of the route
 * @property {string} hash - The hash of the route
 * @property {Object} params - The params of the route
 * @property {Object} data - The data of the route
 * @property {Object} options - The options of the route
 * @property {Object} hooks - The hooks of the route
 * @property {Object} transition - The transition of the route
 * @property {Object} announce - The announce of the route
 * @property {(options: Object, parentEl: BlitsElement, parentComponent: BlitsComponent, rootComponent?: BlitsComponent) => BlitsComponent} component - The component factory of the route
 *
 * @typedef {Object} Hash
 * @property {string} path - The path of the hash
 * @property {URLSearchParams} queryParams - The query params of the hash
 * @property {string} hash - The hash
 *
 */

/** @type {Route} */
export let currentRoute
export const state = reactive(
  {
    path: '',
    navigating: false,
    data: null,
    params: null,
    hash: '',
  },
  Settings.get('reactivityMode'),
  true
)

// Changed from WeakMap to Map to allow for caching of views by the url hash.
// We are manually doing the cleanup of the cache when the route is not marked as keepAlive.

/**
 * @typedef {Object} CacheMapEntry
 * @property {BlitsComponent|BlitsComponentFactory} view - The view of the route
 * @property {BlitsComponent} focus - The focus of the route
 */

/** @type {Map<String, CacheMapEntry>} */
const cacheMap = new Map()
const history = []

let overrideOptions = {}
let navigationData = {}
let navigatingBack = false
let previousFocus

/**
 * Get the current hash
 * @returns {Hash}
 */
export const getHash = () => {
  const hashParts = (document.location.hash || '/').replace(/^#/, '').split('?')
  return {
    path: hashParts[0],
    queryParams: new URLSearchParams(hashParts[1]),
    hash: document.location.hash,
  }
}

const normalizePath = (path) => {
  return (
    path
      // remove leading and trailing slashes
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase()
  )
}

/**
 * Check if a value is an object
 * @param {any} v
 * @returns {boolean} True if v is an object
 */
const isObject = (v) => typeof v === 'object' && v !== null

/**
 * Check if a value is a function
 * @param {any} v
 * @returns {boolean} True if v is a string
 */
const isString = (v) => typeof v === 'string'

/**
 * Match a path to a route
 *
 * @param {string} path
 * @param {Route[]} routes
 * @returns {Route}
 */
export const matchHash = (path, routes = []) => {
  // remove trailing slashes
  const originalPath = path.replace(/^\/+|\/+$/g, '')
  path = normalizePath(path)

  /** @type {boolean|Route} */
  let matchingRoute = false
  let i = 0
  while (!matchingRoute && i < routes.length) {
    const route = routes[i]
    route.path = normalizePath(route.path)
    if (route.path === path) {
      route.params = {}
      matchingRoute = route
    } else if (route.path.indexOf(':') > -1) {
      // match dynamic route parts
      const dynamicRouteParts = [...route.path.matchAll(/:([^\s/]+)/gi)]

      // construct a regex for the route with dynamic parts
      let dynamicRoutePartsRegex = route.path
      dynamicRouteParts.reverse().forEach((part) => {
        dynamicRoutePartsRegex =
          dynamicRoutePartsRegex.substring(0, part.index) +
          '([^\\s/]+)' +
          dynamicRoutePartsRegex.substring(part.index + part[0].length)
      })

      dynamicRoutePartsRegex = '^' + dynamicRoutePartsRegex

      // test if the constructed regex matches the path
      const match = originalPath.match(new RegExp(`${dynamicRoutePartsRegex}`, 'i'))

      if (match) {
        // map the route params to a params object
        route.params = dynamicRouteParts.reverse().reduce((acc, part, index) => {
          acc[part[1]] = match[index + 1]
          return acc
        }, {})
        matchingRoute = route
      }
    } else if (route.path.endsWith('*')) {
      const regex = new RegExp(route.path.replace(/\/?\*/, '/?([^\\s]*)'), 'i')
      const match = path.match(regex)

      if (match) {
        if (match[1]) route.params = { path: match[1] }
        matchingRoute = route
      }
    }
    i++
  }

  if (matchingRoute) {
    matchingRoute.options = { ...matchingRoute.options, ...overrideOptions }
    if (!matchingRoute.data) {
      matchingRoute.data = {}
    }
  }

  // @ts-ignore - Remove me when we have a better way to handle this
  return matchingRoute
}

/**
 * Navigate to a route
 *
 * This isn't the prettiest way to do this, but it works. The reason is that extends
 * only works for Classes or Factory functions. As such we need to use this
 * @typedef {BlitsComponent & {
 *   activeView: BlitsComponent
 * }} RouterViewComponent
 *
 * @this {RouterViewComponent} this
 * @returns {Promise<void>}
 */
export const navigate = async function () {
  Announcer.stop()
  Announcer.clear()
  state.navigating = true
  if (this[symbols.parent][symbols.routes]) {
    let previousRoute = currentRoute //? Object.assign({}, currentRoute) : undefined
    const { hash, path, queryParams } = getHash()
    let route = matchHash(path, this[symbols.parent][symbols.routes])

    currentRoute = route
    if (route) {
      const queryParamsData = {}
      const queryParamsEntries = [...queryParams.entries()]
      for (let i = 0; i < queryParamsEntries.length; i++) {
        queryParamsData[queryParamsEntries[i][0]] = queryParamsEntries[i][1]
      }

      route.data = {
        ...route.data,
        ...navigationData,
        ...queryParamsData,
      }
      // Adding the location hash to the route if it exists.
      if (hash !== null) {
        route.hash = hash
      }
      let beforeEachResult
      if (this[symbols.parent][symbols.routerHooks]) {
        const hooks = this[symbols.parent][symbols.routerHooks]
        if (hooks.beforeEach) {
          beforeEachResult = await hooks.beforeEach.call(this[symbols.parent], route, previousRoute)
          if (isString(beforeEachResult)) {
            to(beforeEachResult)
            return
          }
        }
      }
      // If the resolved result is an object, assign it to the target route object
      route = isObject(beforeEachResult) ? beforeEachResult : route

      let beforeHookOutput
      if (route.hooks) {
        if (route.hooks.before) {
          beforeHookOutput = await route.hooks.before.call(
            this[symbols.parent],
            route,
            previousRoute
          )
          if (isString(beforeHookOutput)) {
            currentRoute = previousRoute
            to(beforeHookOutput)
            return
          }
        }
      }
      route = isObject(beforeHookOutput) ? beforeHookOutput : route
      // add the previous route (technically still the current route at this point)
      // into the history stack, unless navigating back or inHistory flag of route is false
      if (navigatingBack === false && previousRoute && previousRoute.options.inHistory === true) {
        history.push(previousRoute)
      }
      // apply default transition if none specified
      if (!('transition' in route)) {
        /** @ts-ignore */
        route.transition = fadeInFadeOutTransition
      }
      // a transition can be a function returning a dynamic transition object
      // based on current and previous route
      if (typeof route.transition === 'function') {
        route.transition = route.transition(previousRoute, route)
      }

      /** @type {import('../engines/L3/element.js').BlitsElement} */
      let holder

      let { view, focus } = cacheMap.get(route.hash) || {}

      // Announce route change if a message has been specified for this route
      if (route.announce) {
        if (typeof route.announce === 'string') {
          route.announce = {
            message: route.announce,
          }
        }
        Announcer.speak(route.announce.message, route.announce.politeness)
      }

      if (!view) {
        // create a holder element for the new view
        holder = stage.element({ parent: this[symbols.children][0] })
        holder.populate({})
        holder.set('w', '100%')
        holder.set('h', '100%')

        // merge props with potential route params, navigation data and route data to be injected into the component instance
        const props = {
          ...this[symbols.props],
          ...route.params,
          ...route.data,
        }

        view = await route.component({ props }, holder, this)

        if (view[Symbol.toStringTag] === 'Module') {
          if (view.default && typeof view.default === 'function') {
            view = view.default({ props }, holder, this)
          } else {
            Log.error("Dynamic import doesn't have a default export or default is not a function")
          }
        }
        if (typeof view === 'function') {
          // had to inline this because the tscompiler does not like LHS reassignments
          // that also change the type of the variable in a variable union
          view = /** @type {BlitsComponentFactory} */ (view)({ props }, holder, this)
        }
      } else {
        holder = view[symbols.holder]

        // Check, whether cached view holder's alpha prop is exists in transition or not
        let hasAlphaProp = false
        if (route.transition.before) {
          if (Array.isArray(route.transition.before)) {
            for (let i = 0; i < route.transition.before.length; i++) {
              if (route.transition.before[i].prop === 'alpha') {
                hasAlphaProp = true
                break
              }
            }
          } else if (route.transition.before.prop === 'alpha') {
            hasAlphaProp = true
          }
        }
        // set holder alpha when alpha prop is not exists in route transition
        if (hasAlphaProp === false) {
          holder.set('alpha', 1)
        }
      }

      this[symbols.children].push(view)

      // keep reference to the previous focus for storing in cache
      previousFocus = Focus.get()

      const children = this[symbols.children]
      this.activeView = children[children.length - 1]

      // set focus to the view that we're routing to (unless explicitly disabling passing focus)
      if (route.options === undefined || route.options.passFocus !== false) {
        focus ? focus.$focus() : /** @type {BlitsComponent} */ (view).$focus()
      }

      // apply before settings to holder element
      if (route.transition.before) {
        if (Array.isArray(route.transition.before)) {
          for (let i = 0; i < route.transition.before.length; i++) {
            holder.set(route.transition.before[i].prop, route.transition.before[i].value)
          }
        } else {
          holder.set(route.transition.before.prop, route.transition.before.value)
        }
      }

      let shouldAnimate = false

      // apply out out transition on previous view
      if (previousRoute) {
        // only animate when there is a previous route
        shouldAnimate = true
        const oldView = this[symbols.children].splice(1, 1).pop()
        if (oldView) {
          removeView(previousRoute, oldView, route.transition.out)
        }
      }

      state.path = route.path
      state.params = route.params
      state.hash = hash
      state.data = route.data

      // apply in transition
      if (route.transition.in) {
        if (Array.isArray(route.transition.in)) {
          for (let i = 0; i < route.transition.in.length; i++) {
            i === route.transition.length - 1
              ? await setOrAnimate(holder, route.transition.in[i], shouldAnimate)
              : setOrAnimate(holder, route.transition.in[i], shouldAnimate)
          }
        } else {
          await setOrAnimate(holder, route.transition.in, shouldAnimate)
        }
      }
    } else {
      Log.error(`Route ${hash} not found`)
      const routerHooks = this[symbols.parent][symbols.routerHooks]
      if (routerHooks && typeof routerHooks.error === 'function') {
        routerHooks.error.call(this[symbols.parent], `Route ${hash} not found`)
      }
    }
  }

  // reset navigating indicators
  navigatingBack = false
  state.navigating = false
}

/**
 * Remove the currently active view
 *
 * @param {Route} route
 * @param {BlitsComponent} view
 * @param {Object} transition
 */
const removeView = async (route, view, transition) => {
  // apply out transition
  if (transition) {
    if (Array.isArray(transition)) {
      for (let i = 0; i < transition.length; i++) {
        i === transition.length - 1
          ? await setOrAnimate(view[symbols.holder], transition[i])
          : setOrAnimate(view[symbols.holder], transition[i])
      }
    } else {
      await setOrAnimate(view[symbols.holder], transition)
    }
  }

  // cache the page when it's as 'keepAlive' instead of destroying
  if (navigatingBack === false && route.options && route.options.keepAlive === true) {
    cacheMap.set(route.hash, { view: view, focus: previousFocus })
  } else if (navigatingBack === true) {
    // remove the previous route from the cache when navigating back
    // cacheMap.delete will not throw an error if the route is not in the cache
    cacheMap.delete(route.hash)
  }
  /* Destroy the view in the following cases:
   * 1. Navigating forward, and the previous route is not configured with "keep alive" set to true.
   * 2. Navigating back, and the previous route is configured with "keep alive" set to true.
   * 3. Navigating back, and the previous route is not configured with "keep alive" set to true.
   */
  if (route.options && (route.options.keepAlive !== true || navigatingBack === true)) {
    view.destroy()
    view = null
  }

  previousFocus = null
}

const setOrAnimate = (node, transition, shouldAnimate = true) => {
  return new Promise((resolve) => {
    if (shouldAnimate === true) {
      // resolve the promise in the transition end-callback
      // ("extending" end callback when one is already specified)
      let existingEndCallback = transition.end
      transition.end = (...args) => {
        existingEndCallback && existingEndCallback(args)
        // null the callback to enable memory cleanup
        existingEndCallback = null
        resolve()
      }
      node.set(transition.prop, { transition })
    } else {
      node.set(transition.prop, transition.value)
      resolve()
    }
  })
}

export const to = (location, data = {}, options = {}) => {
  navigationData = data
  overrideOptions = options

  window.location.hash = location
}

export const back = function () {
  const route = history.pop()
  if (route && currentRoute !== route) {
    // set indicator that we are navigating back (to prevent adding page to history stack)
    navigatingBack = true

    to(route.hash, route.data, route.options)
    return true
  }

  const backtrack = (currentRoute && currentRoute.options.backtrack) || false

  // If we deeplink to a page without backtrack
  // we we let the RouterView handle back
  if (backtrack === false) {
    return false
  }

  const hashEnd = /(\/:?[\w%\s-]+)$/
  let path = currentRoute.path

  let level = path.split('/').length

  // On root return
  if (level <= 1) {
    return false
  }

  while (level--) {
    if (!hashEnd.test(path)) {
      return false
    }
    // Construct new path to backtrack to
    path = path.replace(hashEnd, '')
    const route = matchHash(path, this[symbols.parent][symbols.routes])

    if (route && backtrack) {
      to(route.path)
      return true
    }
  }

  return false
}

export default {
  navigate,
  to,
  back,
}
