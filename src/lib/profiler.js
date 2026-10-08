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

import { Log } from './log.js'

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
let activeSpan
let renderer
let frameTickHandler
let frameConfig
let activeFrame
let frameHistory = []

const hasPerformance = typeof globalThis.performance === 'object'

const now = () => (hasPerformance === true ? globalThis.performance.now() : Date.now())

const percentile = (values, percent) => {
  if (values.length === 0) return 0
  const index = Math.min(values.length - 1, Math.floor(values.length * percent))
  return values.slice().sort((a, b) => a - b)[index]
}

const frameSummary = (values) => ({
  medianMs: percentile(values, 0.5),
  p95Ms: percentile(values, 0.95),
  p99Ms: percentile(values, 0.99),
  maxMs: values.length === 0 ? 0 : Math.max(...values),
})

const clearFrames = () => {
  activeFrame = undefined
  frameHistory = []
}

const finishFrame = () => {
  if (activeFrame === undefined || activeFrame.sessionId !== sessionId) return
  frameHistory.push(activeFrame)
  if (frameHistory.length > frameConfig.maxFrames) frameHistory.shift()
}

const beginFrame = (data) => {
  finishFrame()
  activeFrame = {
    sessionId,
    intervalMs: typeof data.delta === 'number' ? data.delta : 0,
    totalMs: 0,
    labels: new Map(),
  }
}

const onFrameTick = (...args) => {
  if (enabled !== true || frameConfig === undefined) return
  const data = args[args.length - 1]
  if (!data || typeof data.time !== 'number') return
  beginFrame(data)
}

/**
 * Attaches optional frame collection to a renderer that emits `frameTick`.
 * @param {{on?: Function, off?: Function}} nextRenderer RendererMain instance
 * @returns {void}
 */
export const setProfilerRenderer = (nextRenderer) => {
  if (renderer === nextRenderer) return
  if (renderer && frameTickHandler && typeof renderer.off === 'function') {
    renderer.off('frameTick', frameTickHandler)
  }
  renderer = nextRenderer
  frameTickHandler = undefined
  if (renderer && typeof renderer.on === 'function') {
    frameTickHandler = onFrameTick
    renderer.on('frameTick', frameTickHandler)
  }
}

/**
 * Marks the start of a measurement.
 *
 * Returns `0` when the profiler is disabled, which keeps the overhead
 * down to a single boolean check.
 *
 * @returns {{sessionId: number, startTime: number} | 0} Token to pass into {@link profileEnd}
 */
export const profileBegin = () => {
  if (enabled !== true) return 0
  const token = {
    sessionId,
    startTime: now(),
    parent: activeSpan,
    frame: activeFrame,
  }
  activeSpan = token
  return token
}

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

  if (start.frame && start.frame.sessionId === sessionId) {
    let frameEntry = start.frame.labels.get(name)
    if (frameEntry === undefined) {
      frameEntry = { calls: 0, totalMs: 0 }
      start.frame.labels.set(name, frameEntry)
    }
    frameEntry.calls++
    frameEntry.totalMs += elapsed
    if (start.parent === undefined || start.parent.frame !== start.frame)
      start.frame.totalMs += elapsed
  }

  if (activeSpan === start) activeSpan = start.parent
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

const measurementsSnapshot = () =>
  Object.fromEntries(
    [...stats].map(([name, entry]) => [name, { ...entry, averageMs: entry.totalMs / entry.calls }])
  )

const frameSnapshot = () => {
  const config = frameConfig || { maxFrames: 0, targetFrameMs: 1000 / 60 }
  const intervals = frameHistory.map((frame) => frame.intervalMs)
  const instrumented = frameHistory.map((frame) => frame.totalMs)
  const labels = new Map()
  for (const frame of frameHistory) {
    for (const [name, entry] of frame.labels) {
      let total = labels.get(name)
      if (total === undefined) {
        total = { calls: 0, totalMs: 0 }
        labels.set(name, total)
      }
      total.calls += entry.calls
      total.totalMs += entry.totalMs
    }
  }
  const frameCount = frameHistory.length
  const slowFrames = intervals.filter((value) => value > config.targetFrameMs * 1.5).length
  const slowestFrames = frameHistory
    .slice()
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 10)
    .map((frame) => ({
      intervalMs: frame.intervalMs,
      instrumentedMs: frame.totalMs,
      labels: Object.fromEntries(frame.labels),
    }))
  return {
    frameCount,
    retainedFrameLimit: config.maxFrames,
    frameInterval: frameSummary(intervals),
    instrumentedTime: frameSummary(instrumented),
    slowFramePercent: frameCount === 0 ? 0 : (slowFrames / frameCount) * 100,
    slowestFrames,
    labels: Object.fromEntries(
      [...labels].map(([name, entry]) => [
        name,
        {
          ...entry,
          callsPerFrame: frameCount === 0 ? 0 : entry.calls / frameCount,
          averageMsPerFrame: frameCount === 0 ? 0 : entry.totalMs / frameCount,
        },
      ])
    ),
  }
}

const snapshot = () => ({
  measurements: measurementsSnapshot(),
  frames: frameSnapshot(),
})

const report = () => {
  const result = snapshot()
  const measurements = result.measurements
  const frameLabels = result.frames.labels
  const slowFrames = Object.fromEntries(
    result.frames.slowestFrames.map((frame, index) => [
      `#${index + 1}`,
      {
        intervalMs: frame.intervalMs,
        instrumentedMs: frame.instrumentedMs,
        labels: Object.entries(frame.labels)
          .sort(([, a], [, b]) => b.totalMs - a.totalMs)
          .map(
            ([name, entry]) =>
              `${name}: ${entry.totalMs.toFixed(2)} ms (${entry.calls} ${
                entry.calls === 1 ? 'call' : 'calls'
              })`
          )
          .join(' | '),
      },
    ])
  )

  Log.info('Profiler summary')
  console.table({
    'Measurements tracked': Object.keys(measurements).length,
    'Frames analyzed': result.frames.frameCount,
    'Median frame interval (ms)': result.frames.frameInterval.medianMs,
    'p95 frame interval (ms)': result.frames.frameInterval.p95Ms,
    'Median instrumented time (ms)': result.frames.instrumentedTime.medianMs,
    'p95 instrumented time (ms)': result.frames.instrumentedTime.p95Ms,
    'Slow frames (%)': result.frames.slowFramePercent,
  })
  if (Object.keys(measurements).length) {
    Log.info('Profiler: all marker timings')
    console.table(measurements)
  }
  if (Object.keys(frameLabels).length) {
    Log.info('Profiler: marker timings within retained frames')
    console.table(frameLabels)
  }
  if (Object.keys(slowFrames).length) {
    Log.info('Profiler: most expensive retained frames')
    console.table(slowFrames)
  }
  return result
}

/**
 * Lightweight, opt-in profiler used to measure performance bottlenecks
 * in Blits internals and in App code.
 */
const profiler = {
  /**
   * Clears previously collected measurements and starts recording
   * @returns {void}
   */
  start(options = {}) {
    sessionId++
    stats.clear()
    activeMarks.clear()
    activeSpan = undefined
    frameConfig =
      options.frames === true
        ? {
            maxFrames: options.maxFrames || 300,
            targetFrameMs: 1000 / (options.targetFps || 60),
          }
        : undefined
    clearFrames()
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
    activeSpan = undefined
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
    activeSpan = undefined
    clearFrames()
  },
  /**
   * Returns the measurements collected so far
   * @returns {Object.<string, ProfilerEntry>}
   */
  snapshot,
  report,
  setRenderer: setProfilerRenderer,
  /**
   * Returns frame-oriented measurements collected with start({ frames: true }).
   * @returns {object}
   */
  frameSnapshot,
  /**
   * Whether the profiler is currently recording
   * @returns {boolean}
   */
  get enabled() {
    return enabled
  },
}

export default profiler
