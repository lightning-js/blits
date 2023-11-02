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

export let currentRoute

export const getCurrentRoute = () => {
  return currentRoute
}

import { Log } from '../lib/log.js'
import Element from '../element.js'

export const getHash = () => {
  return (document.location.hash || '/').replace(/^#/, '')
}

export const matchHash = (path, routes = []) => {
  const route = routes
    .filter((r) => {
      return r.path === path
    })
    .pop()
  currentRoute = route
  return route
}

export const navigate = async function () {
  this.navigating = true
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

      // set focus to te router view (that captures all input and prevents any user interaction during transition)
      this.focus()

      // create a holder element for the new view
      const holder = Element({ parent: this[symbols.children][0] })
      holder.populate({})
      holder.set('w', '100%')
      holder.set('h', '100%')

      const view = route.component(this[symbols.props], holder, this)
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
          removeView(oldView, route.transition.out)
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
      view.focus()
    } else {
      Log.error(`Route ${hash} not found`)
    }
  }
  this.navigating = false
}

const removeView = async (view, transition) => {
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
