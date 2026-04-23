import { default as fadeInFadeOutTransition } from './transitions/fadeInOut.js'

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

export const normalizePath = (path) => {
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
export const isObject = (v) => typeof v === 'object' && v !== null

/**
 * Check if a value is a function
 * @param {any} v
 * @returns {boolean} True if v is a string
 */
export const isString = (v) => typeof v === 'string'

export const queryParamsToObject = (queryParams) => {
  if (!queryParams) return {}
  const object = {}
  const queryParamsEntries = [...queryParams.entries()]
  for (let i = 0; i < queryParamsEntries.length; i++) {
    object[queryParamsEntries[i][0]] = queryParamsEntries[i][1]
  }

  return object
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

export const makeRouteObject = (route, overrides, overrideOptions, navigationData) => {
  // FIX: exclude keepAlive from the destination route options. Unlike other
  // overrides, keepAlive applies to the route being LEFT, not the destination.
  // It is consumed by removeView() instead.
  const { keepAlive: _keepAlive, ...destOverrides } = overrideOptions // eslint-disable-line no-unused-vars

  const cleanRoute = {
    hash: overrides.hash,
    path: route.path,
    component: route.component,
    transition: 'transition' in route ? route.transition : fadeInFadeOutTransition,
    options: { ...defaultOptions, ...route.options, ...destOverrides },
    announce: route.announce || false,
    hooks: route.hooks || {},
    data: { ...route.data, ...navigationData, ...overrides.queryParams },
    params: overrides.params || {},
    meta: route.meta || {},
  }

  return cleanRoute
}

/**
 * Match a path to a route
 *
 * @param {object} hashObject
 * @param {Route[]} routes
 * @returns {Route}
 */
export const matchHash = (
  { hash, path, queryParams },
  routes = [],
  overrideOptions = {},
  navigationData = {}
) => {
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
      matchingRoute = makeRouteObject(route, override, overrideOptions, navigationData)
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

        matchingRoute = makeRouteObject(route, override, overrideOptions, navigationData)
      }
    } else if (normalizedPath.endsWith('*')) {
      const regex = new RegExp(normalizedPath.replace(/\/?\*/, '/?([^\\s]*)'), 'i')
      const match = originalNormalizedPath.match(regex)

      if (match) {
        override.params = {}
        if (match[1]) override.params.path = match[1]
        matchingRoute = makeRouteObject(route, override, overrideOptions, navigationData)
      }
    }
    i++
  }

  // @ts-ignore - Remove me when we have a better way to handle this
  return matchingRoute
}
