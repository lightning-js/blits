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
import Element from '../element.js'
import Focus from '../focus.js'

export let currentRoute
export let navigating = false

const cacheMap = new WeakMap()

export const getHash = () => {
  return (document.location.hash || '/').replace(/^#/, '')
}

export const matchHash = (path, routes = []) => {
  const route = routes
    .filter((r) => {
      return r.path === path
    })
    .pop()
  if (route) currentRoute = route
  return route
}

export const navigate = async function () {
  navigating = true
  if (this.parent[symbols.routes]) {
    const previousRoute = currentRoute
    const hash = getHash()
    const route = matchHash(hash, this.parent[symbols.routes])

    if (route) {
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
        holder = Element({ parent: this[symbols.children][0] })
        holder.populate({})
        holder.set('w', '100%')
        holder.set('h', '100%')
        view = await route.component(this[symbols.props], holder, this)
        if (view[Symbol.toStringTag] === 'Module') {
          if (view.default && typeof view.default === 'function') {
            view = view.default(this[symbols.props], holder, this)
          } else {
            Log.error("Dynamic import doesn't have a default export or default is not a function")
          }
        }
      } else {
        holder = view.wrapper
      }

      this[symbols.children].push(view)

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

      // focus the new view
      focus ? Focus.set(focus) : view.focus()
    } else {
      Log.error(`Route ${hash} not found`)
    }
  }
  navigating = false
}

const removeView = async (route, view, transition) => {
  // apply out transition
  if (transition) {
    if (Array.isArray(transition)) {
      for (let i = 0; i < transition.length; i++) {
        i === transition.length - 1
          ? await setOrAnimate(view.wrapper, transition[i])
          : setOrAnimate(view.wrapper, transition[i])
      }
    } else {
      await setOrAnimate(view.wrapper, transition)
    }
  }

  // cache the page when it's as 'keepAlive' instead of destroying
  if (route.options && route.options.keepAlive === true) {
    cacheMap.set(route, { view: view, focus: Focus.get() })
  } else {
    // remove and cleanup
    for (let i = 0; i < view[symbols.children].length - 1; i++) {
      if (view[symbols.children][i] && view[symbols.children][i].destroy) {
        view[symbols.children][i].destroy()
        view[symbols.children][i] = null
      }
    }
    view.destroy()
    view = null
  }
}

const setOrAnimate = (node, transition, shouldAnimate = true) => {
  return shouldAnimate
    ? node.animate(transition.prop, transition)
    : node.set(transition.prop, transition.value)
}

export const to = (location) => {
  window.location.hash = `#${location}`
}

export default {
  navigate,
  to,
}
