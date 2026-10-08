/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

/**
 * @typedef {Object} ProfilerEntry
 * @property {number} calls - Number of times the measurement was recorded
 * @property {number} totalMs - Total time spent, in milliseconds
 * @property {number} maxMs - Slowest single measurement, in milliseconds
 * @property {number} averageMs - Average time per call, in milliseconds
 */

const stats = new Map()
const activeMarks = new Map()
let enabled = false
let sessionId = 0

const hasPerformance = typeof globalThis.performance === 'object'

const now = () => (hasPerformance === true ? globalThis.performance.now() : Date.now())

/**
 * Marks the start of a measurement.
 *
 * Returns `0` when the profiler is disabled, which keeps the overhead
 * down to a single boolean check.
 *
 * @returns {{sessionId: number, startTime: number} | 0} Token to pass into {@link profileEnd}
 */
export const profileBegin = () => (enabled === true ? { sessionId, startTime: now() } : 0)

/**
 * Records a measurement started with {@link profileBegin}.
 *
 * @param {string} name - Label the measurement is aggregated under
 * @param {{sessionId: number, startTime: number} | 0} start - Token returned by {@link profileBegin}
 * @returns {void}
 */
export const profileEnd = (name, start) => {
  if (enabled !== true || !start || start.sessionId !== sessionId) return

  let entry = stats.get(name)
  if (entry === undefined) {
    entry = { calls: 0, totalMs: 0, maxMs: 0 }
    stats.set(name, entry)
  }

  const elapsed = now() - start.startTime
  entry.calls++
  entry.totalMs += elapsed
  if (elapsed > entry.maxMs) entry.maxMs = elapsed
}

const mark = (name) => {
  if (enabled !== true) return

  let marks = activeMarks.get(name)
  if (marks === undefined) {
    marks = []
    activeMarks.set(name, marks)
  }
  marks.push(profileBegin())
}

const markEnd = (name) => {
  if (enabled !== true) return

  const marks = activeMarks.get(name)
  if (marks === undefined) return

  const start = marks.pop()
  if (marks.length === 0) activeMarks.delete(name)
  profileEnd(name, start)
}

/**
 * Measures the execution time of a (synchronous) function.
 *
 * @template T
 * @param {string} name - Label the measurement is aggregated under
 * @param {() => T} fn - Function to measure
 * @returns {T} The return value of `fn`
 */
export const profile = (name, fn) => {
  if (enabled !== true) return fn()
  const start = profileBegin()
  try {
    return fn()
  } finally {
    profileEnd(name, start)
  }
}

const snapshot = () =>
  Object.fromEntries(
    [...stats].map(([name, entry]) => [name, { ...entry, averageMs: entry.totalMs / entry.calls }])
  )

/**
 * Lightweight, opt-in profiler used to measure performance bottlenecks
 * in Blits internals and in App code.
 */
const profiler = {
  /**
   * Clears previously collected measurements and starts recording
   * @returns {void}
   */
  start() {
    sessionId++
    stats.clear()
    activeMarks.clear()
    enabled = true
  },
  /**
   * Marks the start of a measurement
   * @param {string} name - Label the measurement is aggregated under
   * @returns {void}
   */
  mark,
  /**
   * Ends the most recent measurement started with the same name
   * @param {string} name - Label passed to {@link mark}
   * @returns {void}
   */
  markEnd,
  /**
   * Stops recording and returns the collected measurements
   * @returns {Object.<string, ProfilerEntry>}
   */
  stop() {
    enabled = false
    activeMarks.clear()
    return snapshot()
  },
  /**
   * Clears collected measurements and pending spans, without changing the enabled state
   * @returns {void}
   */
  reset() {
    sessionId++
    stats.clear()
    activeMarks.clear()
  },
  /**
   * Returns the measurements collected so far
   * @returns {Object.<string, ProfilerEntry>}
   */
  snapshot,
  /**
   * Whether the profiler is currently recording
   * @returns {boolean}
   */
  get enabled() {
    return enabled
  },
}

export default profiler
