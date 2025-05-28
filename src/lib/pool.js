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

import { Log } from './log.js'
import Settings from '../settings.js'

/**
 * Component pool manager for recycling and reusing Blits components
 * Optimized to use a single generic pool to reduce memory usage and improve performance
 * by avoiding Map lookups and unnecessary object creation
 */

// Single generic array for all components to minimize memory fragmentation
const componentPool = {
  component: [],
  element: [],
  corenode: [],
  textnode: [],
}

// Settings cached as module variables for better performance
let isDebug = true
let maxPoolSize = 500

// Stats tracking
let totalPooled = 0
let totalReused = 0

/**
 * Initialize the component pool with settings values
 * Call this once at application startup
 */
export const initPool = () => {
  isDebug = Settings.get('componentPool.debug', false)
  maxPoolSize = Settings.get('componentPool.maxPoolSize', 50)

  isDebug === true && Log.debug('Component pool initialized, max size', maxPoolSize)
}

/**
 * Acquire a component from the pool
 * @param {'component'|'element'|'corenode'|'textnode'} type - Type of component to acquire
 * @returns {Object|null} - A recycled component instance or null if pool is empty
 */
export const acquire = (type) => {
  const pool = componentPool[type]
  if (pool.length === 0) return null

  isDebug === true &&
    (totalPooled--,
    totalReused++,
    Log.debug(`Reused component from pool (${pool.length} remaining)`))

  return pool.pop()
}

/**
 * Recycle a component to the pool for later reuse
 * @param {'component'|'element'|'corenode'|'textnode'} type - Type of component being recycled (for logging)
 * @param {Object} component - Component instance to recycle
 * @returns {boolean} - True if component was added to pool, false if pool is full
 */
export const recycle = (type, component) => {
  const pool = componentPool[type]
  if (pool.length >= maxPoolSize) {
    isDebug === true && Log.debug(`Component pool is full (${componentPool.length}/${maxPoolSize})`)
    return false
  }

  const idx = pool.length
  pool[idx] = component

  isDebug && (totalPooled++, Log.debug(`Component added to pool (size: ${idx + 1}/${maxPoolSize})`))

  return true
}

/**
 * Get stats about the component pool usage
 * @returns {Object} Pool statistics
 */
export const getPoolStats = () => {
  if (!isDebug) {
    return null
  }

  const totalComponents = totalReused + totalPooled
  const efficiency = totalComponents > 0 ? ((totalReused * 100) / totalComponents) | 0 : 0

  return {
    totalPooled,
    totalReused,
    currentPoolSize: componentPool.length,
    efficiency,
    maxPoolSize,
  }
}

// REMOVE ME
window.addEventListener('keydown', (event) => {
  if (event.key === 'p') {
    // get stats
    const stats = getPoolStats()
    if (stats) {
      Log.info(`Component Pool Stats: ${JSON.stringify(stats)}`)
    } else {
      Log.info('Component Pool Stats are disabled')
    }
  }
})

/**
 * Clear all components from the pool
 */
export const clear = () => {
  componentPool.length = 0

  // Combined debug operations
  if (isDebug) {
    totalPooled = 0
    totalReused = 0
  }
}
