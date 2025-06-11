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

let isLoggingEnabled = false

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

function logStats() {
  if (!__BLITS_STATS__) return
  printStats()
}

const formatStats = (category) => {
  const { created, deleted, active } = stats[category]
  return `Active: ${active}, Created: ${created}, Deleted: ${deleted}`
}

export function printStats() {
  if (!__BLITS_STATS__) return

  Log.info('------------------------------')
  Log.info('--- System Statistics ---')
  Log.info('URL: ', window.location.href)
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
  }
}

export function resetStats() {
  if (!__BLITS_STATS__) return
  for (const category in stats) {
    if (Object.prototype.hasOwnProperty.call(stats, category)) {
      stats[category].created = 0
      stats[category].deleted = 0
      stats[category].active = 0
    }
  }
}

/**
 * Enables logging functionality.
 */
export function enableLogging() {
  if (!__BLITS_STATS__) return
  if (isLoggingEnabled) return
  isLoggingEnabled = true
  logStats()
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
