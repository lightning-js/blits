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

import symbols from '../lib/symbols.js'
import { Log } from '../lib/log.js'
import { stage } from '../launch.js'
import Focus from '../focus.js'
import Announcer from '../announcer/announcer.js'

export let currentRoute
export let navigating = false

const cacheMap = new WeakMap()
const history = []

let overrideOptions = {}
let navigationData = {}
let navigatingBack = false
let previousFocus

export const getHash = () => {
  return (document.location.hash || '/').replace(/^#/, '')
}

const normalizePath = (path) => {
  return (
    path
      // remove leading and trailing slashes
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase()
  )
}
const isObject = (v) => typeof v === 'object' && v !== null

const isString = (v) => typeof v === 'string'

export const matchHash = (path, routes = []) => {
  // remove trailing slashes
  const originalPath = path
  path = normalizePath(path)
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
    currentRoute = matchingRoute
  }

  return matchingRoute
}

export const navigate = async function () {
  navigating = true
  if (this.parent[symbols.routes]) {
    const previousRoute = currentRoute
    const hash = getHash()
    let route = matchHash(hash, this.parent[symbols.routes])
    let beforeHookOutput
    if (route) {
      if (route.hooks) {
        if (route.hooks.before) {
          beforeHookOutput = await route.hooks.before(route, previousRoute)
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
        route.transition = fadeInFadeOutTransition
      }
      // a transition can be a function returning a dynamic transition object
      // based on current and previous route
      if (typeof route.transition === 'function') {
        route.transition = route.transition(previousRoute, route)
      }

      let holder
      let { view, focus } = cacheMap.get(route) || {}

      if (!view) {
        // create a holder element for the new view
        holder = stage.element({ parent: this[symbols.children][0] })
        holder.populate({})
        holder.set('w', '100%')
        holder.set('h', '100%')
        // merge props with potential route params, navigation data and route data to be injected into the component instance
        const props = { ...this[symbols.props], ...route.params, ...navigationData, ...route.data }

        view = await route.component({ props }, holder, this)
        if (view[Symbol.toStringTag] === 'Module') {
          if (view.default && typeof view.default === 'function') {
            view = view.default({ props }, holder, this)
          } else {
            Log.error("Dynamic import doesn't have a default export or default is not a function")
          }
        }
        if (typeof view === 'function') {
          view = view({ props }, holder, this)
        }
      } else {
        holder = view[symbols.holder]
      }

      this[symbols.children].push(view)

      // keep reference to the previous focus for storing in cache
      previousFocus = Focus.get()

      // set focus to the view that we're routing to
      focus ? Focus.set(focus) : Focus.set(view)

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

      // Announce route change if a message has been specified for this route
      if (route.announce) {
        if (typeof route.announce === 'string') {
          route.announce = {
            message: route.announce,
          }
        }
        Announcer.speak(route.announce.message, route.announce.politeness)
      }

      this.activeView = this[symbols.children][this[symbols.children].length - 1]
    } else {
      Log.error(`Route ${hash} not found`)
    }
  }

  // reset navigating indicators
  navigatingBack = false
  navigating = false
}

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
  if (route.options && route.options.keepAlive === true) {
    cacheMap.set(route, { view: view, focus: previousFocus })
  } else {
    view.destroy()
    view = null
  }
}

const setOrAnimate = (node, transition, shouldAnimate = true) => {
  return new Promise((resolve) => {
    if (shouldAnimate) {
      // resolve the promise in the transition end-callback
      // ("extending" end callback when one is already specified)
      const existingEndCallback = transition.end
      transition.end = existingEndCallback
        ? (...args) => {
            existingEndCallback(...args)
            resolve()
          }
        : resolve
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
  window.location.hash = `#${location}`
}

export const back = () => {
  const route = history.pop()
  if (route) {
    // set indicator that we are navigating back (to prevent adding page to history stack)
    navigatingBack = true
    let targetRoutePath = route.path
    if (targetRoutePath.indexOf(':') > -1) {
      Object.keys(route.params).forEach((item) => {
        targetRoutePath = targetRoutePath.replace(`:${item}`, route.params[item])
      })
    }
    to(targetRoutePath)
    return true
  } else {
    return false
  }
}

export default {
  navigate,
  to,
  back,
}
