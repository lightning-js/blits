import { Log } from './log'

/**
 * Blits Stats module to track and report system statistics.
 */
const stats = {
  components: { created: 0, deleted: 0, active: 0 },
  elements: { created: 0, deleted: 0, active: 0 },
  eventListeners: { created: 0, deleted: 0, active: 0 },
  timeouts: { created: 0, deleted: 0, active: 0 },
  intervals: { created: 0, deleted: 0, active: 0 },
}

const rollingAverages = {
  components: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
  elements: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
  eventListeners: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
  timeouts: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
  intervals: { oneMin: 0, fiveMin: 0, fifteenMin: 0, lastActive: 0 },
}

let isLoggingEnabled = false
let loggingInterval = 10000 // Default interval in milliseconds

/**
 * Increment a specific statistic in the given category.
 * No-op if logging is not enabled.
 * @param {string} category - The category to update (e.g., 'components', 'elements', 'eventListeners').
 * @param {string} type - The type of statistic to update (e.g., 'created', 'deleted').
 */
export function increment(category, type) {
  if (!isLoggingEnabled) return
  if (stats[category] && stats[category][type] !== undefined) {
    stats[category][type]++
    if (type === 'created') stats[category].active++
  }
}

/**
 * Decrement a specific statistic in the given category.
 * No-op if logging is not enabled.
 * @param {string} category - The category to update (e.g., 'components', 'elements', 'eventListeners').
 * @param {string} type - The type of statistic to update (e.g., 'created', 'deleted').
 */
export function decrement(category, type) {
  if (!isLoggingEnabled) return
  if (stats[category] && stats[category][type] !== undefined) {
    stats[category][type]++
    if (type === 'deleted') stats[category].active--
  }
}

function updateRollingAverage(category, currentActive, intervalInSeconds) {
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

/**
 * Log the current statistics using the internal logger.
 * Includes formatted output with percentage differences and load averages.
 */
function logStats() {
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
  Log.info('-------------------------')
}

/**
 * Start periodic logging of system statistics.
 * Logs statistics at the configured interval using the internal logger.
 * Enables logging functionality.
 * @param {number} [interval=10000] - The logging interval in milliseconds.
 */
export function startLogging(interval = 10000) {
  if (isLoggingEnabled) return
  isLoggingEnabled = true
  loggingInterval = interval
  logStats()
  setInterval(logStats, loggingInterval)
}
