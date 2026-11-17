/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'tape'
import { createFacade } from './launch.js'
import { initLog } from '../../lib/log.js'

initLog()

const makeSignal = () => {
  const listeners = new Set()
  return {
    subscribe(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    fire(data) {
      for (const cb of listeners) cb(data)
    },
    listeners,
  }
}

test('FTL facade provides frame timing and disposes its signal subscriptions', (t) => {
  const signals = { idle: makeSignal(), tick: makeSignal(), contextLost: makeSignal() }
  let stops = 0
  let cleanups = 0
  let clearColor
  const app = {
    signals,
    root: {},
    ready: Promise.resolve(),
    start() {},
    stop() {
      stops++
    },
    setClearColor(color) {
      clearColor = color
    },
  }
  const facade = createFacade(app, {}, { fpsInterval: 0 }, () => cleanups++)
  let timing
  let context
  facade.on('frameTick', (target, data) => {
    t.equal(target, facade, 'frame target is the renderer facade')
    timing = data
  })
  facade.on('contextLost', (_target, data) => {
    context = data
  })
  signals.tick.fire(16)
  signals.contextLost.fire({ generation: 1 })
  facade.setClearColor([1, 0, 0, 1])

  t.equal(typeof timing.time, 'number', 'profiler receives a numeric timestamp')
  t.equal(timing.delta, 16, 'frame hook receives the delta in milliseconds')
  t.deepEqual(context, { generation: 1 }, 'context events are forwarded')
  t.deepEqual(clearColor, [1, 0, 0, 1], 'clear color delegates to the FTL app')
  t.equal(facade.ready, app.ready, 'first-frame readiness is available separately')
  facade.destroy()
  facade.destroy()
  t.equal(stops, 1, 'destroy stops the app only once')
  t.equal(cleanups, 1, 'integration cleanup runs only once')
  for (const name in signals) {
    t.equal(signals[name].listeners.size, 0, `${name} subscription removed`)
  }
  t.end()
})
