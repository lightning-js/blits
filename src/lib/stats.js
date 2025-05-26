import { Log } from './log.js'
import { renderer } from '../launch.js'

// Vite flag for enabling stats (should be replaced at build time)
// Use globalThis to avoid TDZ and reference errors
// prettier-ignore
const __BLITS_STATS__ = typeof globalThis.__BLITS_STATS__ !== 'undefined' ? globalThis.__BLITS_STATS__ : false

/**
 * Blits Stats module to track and report system statistics.
 * Only enabled if __BLITS_STATS__ is true at build time.
 */
const stats = __BLITS_STATS__
  ? {
      components: { created: 0, deleted: 0, active: 0 },
      elements: { created: 0, deleted: 0, active: 0 },
      eventListeners: { created: 0, deleted: 0, active: 0 },
      timeouts: { created: 0, deleted: 0, active: 0 },
      intervals: { created: 0, deleted: 0, active: 0 },
    }
  : null

const rollingAverages = __BLITS_STATS__
  ? {
      components: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
      elements: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
      eventListeners: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
      timeouts: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
      intervals: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
    }
  : null

let isLoggingEnabled = false
let loggingInterval = 10000 // Default interval in milliseconds

/**
 * Increment a specific statistic in the given category.
 * No-op if stats are not enabled.
 * @param {string} category - The category to update (e.g., 'components', 'elements', 'eventListeners').
 * @param {string} type - The type of statistic to update (e.g., 'created', 'deleted').
 */
export function increment(category, type) {
  if (!__BLITS_STATS__ || !isLoggingEnabled) return
  if (stats[category] && stats[category][type] !== undefined) {
    stats[category][type]++
    if (type === 'created') stats[category].active++
  }
}

/**
 * Decrement a specific statistic in the given category.
 * No-op if stats are not enabled.
 * @param {string} category - The category to update (e.g., 'components', 'elements', 'eventListeners').
 * @param {string} type - The type of statistic to update (e.g., 'created', 'deleted').
 */
export function decrement(category, type) {
  if (!__BLITS_STATS__ || !isLoggingEnabled) return
  if (stats[category] && stats[category][type] !== undefined) {
    stats[category][type]++
    if (type === 'deleted') stats[category].active--
  }
}

function updateRollingAverage(category, currentActive, intervalInSeconds) {
  if (!__BLITS_STATS__) return { oneMin: 0, fiveMin: 0, fifteenMin: 0 }
  const averages = rollingAverages[category]
  const diff = currentActive - averages.lastActive
  averages.lastActive = currentActive

  // Update rolling averages using exponential moving average formula
  const oneMinFactor = intervalInSeconds / 60
  const fiveMinFactor = intervalInSeconds / 300
  const fifteenMinFactor = intervalInSeconds / 900

  averages.oneMin = averages.oneMin * (1 - oneMinFactor) + diff * oneMinFactor
  averages.fiveMin = averages.fiveMin * (1 - fiveMinFactor) + diff * fiveMinFactor
  averages.fifteenMin = averages.fifteenMin * (1 - fifteenMinFactor) + diff * fifteenMinFactor

  return {
    oneMin: averages.oneMin.toFixed(2),
    fiveMin: averages.fiveMin.toFixed(2),
    fifteenMin: averages.fifteenMin.toFixed(2),
  }
}

function logStats() {
  if (!__BLITS_STATS__) return
  const intervalInSeconds = loggingInterval / 1000

  const formatStats = (category) => {
    const { created, deleted, active } = stats[category]
    const loadAverages = updateRollingAverage(category, active, intervalInSeconds)

    return `Active: ${active}, Created: ${created}, Deleted: ${deleted}, Load: ${loadAverages.oneMin}, ${loadAverages.fiveMin}, ${loadAverages.fifteenMin}`
  }

  Log.info('--- System Statistics ---')
  Log.info('Components:', formatStats('components'))
  Log.info('Elements:', formatStats('elements'))
  Log.info('Listeners:', formatStats('eventListeners'))
  Log.info('Timeouts:', formatStats('timeouts'))
  Log.info('Intervals:', formatStats('intervals'))

  const memInfo = renderer?.stage?.txMemManager.getMemoryInfo() || null
  if (memInfo) {
    Log.info('--- Renderer Memory Info ---')
    Log.info(
      `Memory used: ${bytesToMb(memInfo.memUsed)} Mb, Renderable: ${bytesToMb(
        memInfo.renderableMemUsed
      )} Mb, Target: ${bytesToMb(memInfo.targetThreshold)} Mb, Critical: ${bytesToMb(
        memInfo.criticalThreshold
      )} Mb`
    )
    Log.info(
      `Textures loaded ${memInfo.loadedTextures}, renderable textures: ${memInfo.renderableTexturesLoaded}`
    )
    Log.info('------------------------------')
  }
}

/**
 * Start periodic logging of system statistics.
 * Logs statistics at the configured interval using the internal logger.
 * Enables logging functionality.
 * @param {number} [interval=10000] - The logging interval in milliseconds.
 */
export function startLogging(interval = 10000) {
  if (!__BLITS_STATS__) return
  if (isLoggingEnabled) return
  isLoggingEnabled = true
  loggingInterval = interval
  logStats()
  setInterval(logStats, loggingInterval)
}

/**
 * Get stats for a given category (for UI overlay).
 * @param {string} category
 * @returns {object|null}
 */
export function getStats(category) {
  if (!__BLITS_STATS__ || !stats) return null
  return stats[category] || null
}

/**
 * Format bytes to MB (for UI overlay).
 * @param {number} bytes
 * @returns {string}
 */
export function bytesToMb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2)
}

/**
 * Expose the build-time stats flag for use in other modules.
 * @type {boolean}
 */
export const BLITS_STATS_ENABLED = __BLITS_STATS__
