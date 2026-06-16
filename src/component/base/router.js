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

import symbols from '../../lib/symbols.js'
import {
  back,
  currentRoute,
  getRegisteredRouterView,
  getSingleRegisteredRouterView,
  state,
  toRouterView,
} from '../../router/router.js'

const routerCache = new WeakMap()

const isRouterView = (component, routerViewName = '') => {
  if (component === undefined || component === null) return false
  return (
    Array.isArray(component.history) && (routerViewName === '' || component.name === routerViewName)
  )
}

const getRouterViewInChildren = (component, routerViewName = '') => {
  if (component === undefined || component === null) return null

  const children = component[symbols.children]
  if (Array.isArray(children) === false) return null

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isRouterView(child, routerViewName)) return child

    const nestedRouterView = getRouterViewInChildren(child, routerViewName)
    if (nestedRouterView !== null) return nestedRouterView
  }

  return null
}

const getRouterView = (component, routerViewName = '') => {
  let current = component
  while (current !== undefined && current !== null) {
    if (isRouterView(current, routerViewName)) {
      return current
    }
    current = current[symbols.parent]
  }
  return getRouterViewInChildren(component, routerViewName)
}

const resolveRouterView = (component, routerViewName) => {
  if (routerViewName !== undefined) {
    const registeredRouterView = getRegisteredRouterView(routerViewName)
    if (registeredRouterView !== null) return registeredRouterView

    return getRouterView(component, routerViewName)
  }

  const singleRouterView = getSingleRegisteredRouterView()
  if (singleRouterView !== null) return singleRouterView

  return getRouterView(component)
}

const getRoutes = (component, routerViewName) => {
  const routerView = resolveRouterView(component, routerViewName)
  if (
    routerView !== null &&
    routerView[symbols.parent] !== undefined &&
    routerView[symbols.parent][symbols.routes] !== undefined
  ) {
    return routerView[symbols.parent][symbols.routes]
  }

  if (component[symbols.routes] !== undefined) return component[symbols.routes]

  if (
    component[symbols.parent] !== undefined &&
    component[symbols.parent][symbols.routes] !== undefined
  ) {
    return component[symbols.parent][symbols.routes]
  }

  return undefined
}

const getRouterFromCache = (component, routerViewName) => {
  let routers = routerCache.get(component)
  if (routers === undefined) {
    routers = new Map()
    routerCache.set(component, routers)
  }

  const cacheKey = routerViewName === undefined ? '' : routerViewName
  const router = routers.get(cacheKey)
  if (router !== undefined) return router

  const newRouter = createRouter(component, routerViewName)
  routers.set(cacheKey, newRouter)
  return newRouter
}

const createRouter = (component, routerViewName) => {
  return {
    to(path, data = {}, options = {}) {
      const routerView = resolveRouterView(component, routerViewName)
      if (routerView === null) return false

      toRouterView(routerView, path, data, options)
      return true
    },
    back() {
      const routerView = resolveRouterView(component, routerViewName)
      return routerView === null ? false : back.call(routerView)
    },
    get(name) {
      return getRouterFromCache(component, name)
    },
    get backNavigation() {
      return state.backNavigation !== false
    },
    set backNavigation(enabled) {
      state.backNavigation = enabled !== false
    },
    get currentRoute() {
      const routerView = resolveRouterView(component, routerViewName)
      return routerView === null ? currentRoute : routerView.currentRoute
    },
    get routes() {
      return getRoutes(component, routerViewName)
    },
    get navigating() {
      return state.navigating
    },
    state,
  }
}

export default {
  $router: {
    get() {
      return getRouterFromCache(this)
    },
    enumerable: true,
    configurable: false,
  },
}
