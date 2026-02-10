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
 * @typedef {BlitsComponent|BlitsComponentFactory} RouteView
 * @typedef {RouteView & { default?: BlitsComponentFactory }} RouteViewWithOptionalDefault
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
    backNavigation: true,
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

const history = []

let overrideOptions = {}
let navigationData = {}
let navigatingBack = false
let navigatingBackTo = undefined
let previousFocus
// Skips internal router navigation when set to true only for the next "navigate"
// execution, needed for window.history management
let preventHashChangeNavigation = false
/**
 * Get the current hash
 * @returns {Hash}
 */
export const getHash = (hash) => {
  if (!hash) hash = '/'
  const hashParts = hash.replace(/^#/, '').split('?')
  return {
    path: hashParts[0],
    queryParams: new URLSearchParams(hashParts[1]),
    hash: hash,
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

const queryParamsToObject = (queryParams) => {
  if (!queryParams) return {}
  const object = {}
  const queryParamsEntries = [...queryParams.entries()]
  for (let i = 0; i < queryParamsEntries.length; i++) {
    object[queryParamsEntries[i][0]] = queryParamsEntries[i][1]
  }

  return object
}

/**
 * Match a path to a route
 *
 * @param {object} hashObject
 * @param {Route[]} routes
 * @returns {Route}
 */
export const matchHash = ({ hash, path, queryParams }, routes = []) => {
  // remove trailing slashes
  const originalPath = path.replace(/^\/+|\/+$/g, '')
  const originalNormalizedPath = normalizePath(path)

  const override = {
    hash: hash,
    queryParams: queryParamsToObject(queryParams),
    path: path,
  }

  /** @type {boolean|Route} */
  let matchingRoute = false
  let i = 0
  while (!matchingRoute && i < routes.length) {
    const route = routes[i]

    const normalizedPath = normalizePath(route.path)
    if (normalizePath(normalizedPath) === originalNormalizedPath) {
      matchingRoute = makeRouteObject(route, override)
    } else if (normalizedPath.indexOf(':') > -1) {
      // match dynamic route parts
      const dynamicRouteParts = [...normalizedPath.matchAll(/:([^\s/]+)/gi)]

      // construct a regex for the route with dynamic parts
      let dynamicRoutePartsRegex = normalizedPath
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
        override.params = dynamicRouteParts.reverse().reduce((acc, part, index) => {
          acc[part[1]] = match[index + 1]
          return acc
        }, {})

        matchingRoute = makeRouteObject(route, override)
      }
    } else if (normalizedPath.endsWith('*')) {
      const regex = new RegExp(normalizedPath.replace(/\/?\*/, '/?([^\\s]*)'), 'i')
      const match = originalNormalizedPath.match(regex)

      if (match) {
        override.params = {}
        if (match[1]) override.params.path = match[1]
        matchingRoute = makeRouteObject(route, override)
      }
    }
    i++
  }

  // @ts-ignore - Remove me when we have a better way to handle this
  return matchingRoute
}

/**
 * Default Route options
 *
 */
const defaultOptions = {
  inHistory: true,
  keepAlive: false,
  passFocus: true,
  reuseComponent: false,
}

const makeRouteObject = (route, overrides) => {
  const cleanRoute = {
    hash: overrides.hash,
    path: route.path,
    component: route.component,
    transition: 'transition' in route ? route.transition : fadeInFadeOutTransition,
    options: { ...defaultOptions, ...route.options, ...overrideOptions },
    announce: route.announce || false,
    hooks: route.hooks || {},
    data: { ...route.data, ...navigationData, ...overrides.queryParams },
    params: overrides.params || {},
    meta: route.meta || {},
  }

  return cleanRoute
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
  let reuse = false
  if (preventHashChangeNavigation === false && this[symbols.parent][symbols.routes]) {
    let previousRoute = currentRoute //? Object.assign({}, currentRoute) : undefined
    let route = matchHash(getHash(document.location.hash), this[symbols.parent][symbols.routes])

    currentRoute = route

    if (route) {
      const currentPath = currentRoute.path
      let beforeEachResult
      if (this[symbols.parent][symbols.routerHooks]) {
        const hooks = this[symbols.parent][symbols.routerHooks]
        if (hooks.beforeEach) {
          try {
            beforeEachResult = await hooks.beforeEach.call(this.parent, route, previousRoute)
            if (isString(beforeEachResult)) {
              currentRoute = previousRoute
              to(beforeEachResult)
              return
            }
          } catch (error) {
            Log.error('Error or Rejected Promise in "BeforeEach" Hook', error)

            if (history.length > 0) {
              preventHashChangeNavigation = true
              currentRoute = previousRoute
              window.history.back()

              navigatingBack = false
              state.navigating = false
              return
            }
          }
          // If the resolved result is an object, redirect if the path in the object was changed
          if (isObject(beforeEachResult) === true && beforeEachResult.path !== currentPath) {
            currentRoute = previousRoute
            to(beforeEachResult.path, beforeEachResult.data, beforeEachResult.options)
            return
          }
          // If the resolved result is false, cancel navigation
          if (beforeEachResult === false && history.length > 0) {
            preventHashChangeNavigation = true
            currentRoute = previousRoute
            window.history.back()

            navigatingBack = false
            state.navigating = false
            return
          }
        }
      }

      let beforeHookOutput
      if (route.hooks.before) {
        try {
          beforeHookOutput = await route.hooks.before.call(this.parent, route, previousRoute)
          if (isString(beforeHookOutput)) {
            currentRoute = previousRoute
            to(beforeHookOutput)
            return
          }
        } catch (error) {
          Log.error('Error or Rejected Promise in "Before" Hook', error)

          if (history.length > 0) {
            preventHashChangeNavigation = true
            currentRoute = previousRoute
            window.history.back()

            navigatingBack = false
            state.navigating = false
            return
          }
        }
        // If the resolved result is an object, redirect if the path in the object was changed
        if (isObject(beforeHookOutput) === true && beforeHookOutput.path !== currentPath) {
          currentRoute = previousRoute
          to(beforeHookOutput.path, beforeHookOutput.data, beforeHookOutput.options)
          return
        }
        // If the resolved result is false, cancel navigation
        if (beforeHookOutput === false && history.length > 0) {
          preventHashChangeNavigation = true
          currentRoute = previousRoute
          window.history.back()

          navigatingBack = false
          state.navigating = false
          return
        }
      }

      // add the previous route (technically still the current route at this point)
      // into the history stack when inHistory is true and we're not navigating back
      if (
        previousRoute !== undefined &&
        previousRoute.options.inHistory === true &&
        navigatingBack === false
      ) {
        history.push(previousRoute)
      }

      // a transition can be a function returning a dynamic transition object
      // based on current and previous route
      if (typeof route.transition === 'function') {
        route.transition = route.transition(previousRoute, route)
      }

      /** @type {import('../engines/L3/element.js').BlitsElement} */
      let holder

      /** @type {RouteViewWithOptionalDefault|undefined|null} */
      let view
      let focus
      // when navigating back let's see if we're navigating back to a route that was kept alive
      if (navigatingBack === true && navigatingBackTo !== undefined) {
        view = navigatingBackTo.view
        focus = navigatingBackTo.focus
        navigatingBackTo = null
      }
      // merge props with potential route params, navigation data and route data to be injected into the component instance
      const props = {
        ...this[symbols.props],
        ...route.params,
        ...route.data,
      }

      // see if the component of the previous route can be reused for the
      // current route
      if (
        previousRoute &&
        route.options.reuseComponent === true &&
        route.options.keepAlive !== true &&
        route.component === previousRoute.component
      ) {
        reuse = true
        view = this[symbols.children][this[symbols.children].length - 1]
        for (const prop in props) {
          view[symbols.props][prop] = props[prop]
        }
      }

      // Announce route change if a message has been specified for this route
      if (route.announce) {
        if (typeof route.announce === 'string') {
          route.announce = {
            message: route.announce,
          }
        }
        Announcer.speak(route.announce.message, route.announce.politeness)
      }

      // Update router state after announcements and final route resolution,
      // right before initializing or restoring the view
      state.path = route.path
      state.params = Object.keys(route.params).length === 0 ? null : route.params
      state.hash = route.hash
      state.data = null
      state.data = route.data || {}

      if (!view) {
        // create a holder element for the new view
        holder = stage.element({ parent: this[symbols.children][0] })
        holder.populate({})
        holder.set('w', '100%')
        holder.set('h', '100%')

        view = await route.component({ props }, holder, this)

        // is the component a dynamic module?
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

      // store the new view as new child, only if we're not reusing the previous page component
      if (reuse === false) {
        this[symbols.children].push(view)
      }

      // keep reference to the previous focus for storing in cache
      previousFocus = Focus.get()

      const children = this[symbols.children]
      this.activeView = children[children.length - 1]

      // set focus to the view that we're routing to (unless explicitly disabling passing focus)
      if (route.options.passFocus !== false) {
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

      // apply out out transition on previous view if available, unless
      // we're reusing the prvious page component
      if (previousRoute !== undefined && reuse === false) {
        // only animate when there is a previous route
        shouldAnimate = true
        const oldView = this[symbols.children].splice(1, 1).pop()
        if (oldView) {
          await removeView(previousRoute, oldView, route.transition.out, navigatingBack)
        }
      }

      // apply in transition
      if (route.transition.in) {
        if (Array.isArray(route.transition.in)) {
          for (let i = 0; i < route.transition.in.length; i++) {
            i === route.transition.in.length - 1
              ? await setOrAnimate(holder, route.transition.in[i], shouldAnimate)
              : setOrAnimate(holder, route.transition.in[i], shouldAnimate)
          }
        } else {
          await setOrAnimate(holder, route.transition.in, shouldAnimate)
        }
      }

      if (this[symbols.parent][symbols.routerHooks]) {
        const hooks = this[symbols.parent][symbols.routerHooks]
        if (hooks.afterEach) {
          try {
            await hooks.afterEach.call(
              this.parent,
              route, // to
              previousRoute // from
            )
          } catch (error) {
            Log.error('Error in "AfterEach" Hook', error)
          }
        }
      }

      if (route.hooks.after) {
        try {
          await route.hooks.after.call(
            this.parent,
            route, // to
            previousRoute // from
          )
        } catch (error) {
          Log.error('Error or Rejected Promise in "After" Hook', error)
        }
      }
    } else {
      Log.error(`Route ${route.hash} not found`)
      const routerHooks = this[symbols.parent][symbols.routerHooks]
      if (routerHooks && typeof routerHooks.error === 'function') {
        routerHooks.error.call(this[symbols.parent], `Route ${route.hash} not found`)
      }
    }
  }

  // reset navigating indicators
  navigatingBack = false
  state.navigating = false
  preventHashChangeNavigation = false
}

/**
 * Remove the currently active view
 *
 * @param {Route} route
 * @param {BlitsComponent} view
 * @param {Object} transition
 */
const removeView = async (route, view, transition, navigatingBack) => {
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
  if (
    navigatingBack === false &&
    route.options &&
    route.options.keepAlive === true &&
    route.options.inHistory === true
  ) {
    const historyItem = history[history.length - 1]
    if (historyItem !== undefined) {
      historyItem.view = view
      historyItem.focus = previousFocus
    }
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
  route = null
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
      if (node !== undefined) node.set(transition.prop, { transition })
      else resolve()
    } else {
      node !== undefined && node.set(transition.prop, transition.value)
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
    navigatingBackTo = route
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
    const route = matchHash(getHash(path), this[symbols.parent][symbols.routes])

    if (route && backtrack) {
      to(route.path, route.data, route.options)
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
