/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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
 *
 * Application-level mouse support tests. Uses document/window listener spies;
 * tests that use runApplicationInit must use try/finally and call cleanupAppAndRestore so
 * globals are restored if the test throws.
 */

import test from 'tape'
import { initLog } from './lib/log.js'
import Hover from './focus/hover.js'
import Settings from './settings.js'
import symbols from './lib/symbols.js'

initLog()

const createComponent = (id, parent) => ({
  $componentId: id,
  [symbols.parent]: parent,
  [symbols.lifecycle]: { state: 'init' },
})
const getKeydown = (docAdded) => docAdded.find((c) => c.event === 'keydown')
const getKeyup = (docAdded) => docAdded.find((c) => c.event === 'keyup')

function createMockApp() {
  return {
    $componentId: 'App',
    [symbols.lifecycle]: { state: 'init' },
    [symbols.parent]: undefined,
    $announcer: { toggle: () => {}, configure: () => {} },
    $emit: () => {},
  }
}

function createListenerSpies() {
  const docAdded = []
  const docRemoved = []
  const winAdded = []
  const winRemoved = []
  const docAdd = document.addEventListener.bind(document)
  const docRemove = document.removeEventListener.bind(document)
  const winAdd = window.addEventListener.bind(window)
  const winRemove = window.removeEventListener.bind(window)
  document.addEventListener = (e, h) => {
    docAdded.push({ event: e, handler: h })
    docAdd(e, h)
  }
  document.removeEventListener = (e, h) => {
    docRemoved.push({ event: e, handler: h })
    docRemove(e, h)
  }
  window.addEventListener = (e, h) => {
    winAdded.push({ event: e, handler: h })
    winAdd(e, h)
  }
  window.removeEventListener = (e, h) => {
    winRemoved.push({ event: e, handler: h })
    winRemove(e, h)
  }
  const restore = () => {
    document.addEventListener = docAdd
    document.removeEventListener = docRemove
    window.addEventListener = winAdd
    window.removeEventListener = winRemove
  }
  return { docAdded, docRemoved, winAdded, winRemoved, restore }
}

async function runApplicationInit(mouseEnabled) {
  const { default: Application } = await import('./application.js')
  Settings.set('enableMouse', mouseEnabled)
  const spies = createListenerSpies()
  const config = {}
  Application(config)
  config.hooks[symbols.init].call(createMockApp())
  return { config, ...spies }
}

function cleanupAppAndRestore(config, restore, opts = {}) {
  if (opts.restoreHoverClear !== undefined) {
    Hover.clear = opts.restoreHoverClear
    Hover.clear()
  }
  config.hooks[symbols.destroy].call(createMockApp())
  restore()
  Settings.set('enableMouse', false)
}

const keyEvent = (key, keyCode, type = 'keydown') => {
  const event = new KeyboardEvent(type, { key, bubbles: true })
  Object.defineProperty(event, 'keyCode', { value: keyCode })
  return event
}

function spyHoverClear() {
  const original = Hover.clear
  let called = false
  Hover.clear = () => {
    called = true
    original()
  }
  return {
    original,
    get clearCalled() {
      return called
    },
  }
}

test('Mouse listeners not added when enableMouse is false', async (assert) => {
  const { config, docAdded, winAdded, restore } = await runApplicationInit(false)
  try {
    assert.equal(
      docAdded.filter((c) => c.event === 'mousemove' || c.event === 'click').length,
      0,
      'no document mouse listeners when enableMouse is false'
    )
    assert.equal(
      winAdded.filter((c) => c.event === 'resize' || c.event === 'scroll').length,
      0,
      'no window resize/scroll listeners when enableMouse is false'
    )
  } finally {
    cleanupAppAndRestore(config, restore)
  }
})

test('Destroy without prior init does not throw', async (assert) => {
  const { default: Application } = await import('./application.js')
  const config = {}
  Application(config)
  const mockApp = createMockApp()
  try {
    assert.doesNotThrow(
      () => config.hooks[symbols.destroy].call(mockApp),
      'destroy hook should be safe to call when init was never run'
    )
  } finally {
    Settings.set('enableMouse', false)
  }
})

test('Mouse listeners added when enableMouse is true', async (assert) => {
  const { config, docAdded, winAdded, restore } = await runApplicationInit(true)
  try {
    const events = [
      [docAdded, ['mousemove', 'click']],
      [winAdded, ['resize', 'scroll']],
    ]
    for (const [added, names] of events) {
      for (const e of names) {
        assert.true(
          added.some((c) => c.event === e),
          `${e} listener should be added`
        )
      }
    }
  } finally {
    cleanupAppAndRestore(config, restore)
  }
})

test('Destroy removes mouse listeners and clears hover', async (assert) => {
  const { config, docAdded, docRemoved, winAdded, winRemoved, restore } =
    await runApplicationInit(true)
  const hoverSpy = spyHoverClear()
  try {
    config.hooks[symbols.destroy].call(createMockApp())
    const events = [
      { doc: docAdded, docR: docRemoved, name: 'mousemove' },
      { doc: docAdded, docR: docRemoved, name: 'click' },
      { doc: winAdded, docR: winRemoved, name: 'resize' },
      { doc: winAdded, docR: winRemoved, name: 'scroll' },
    ]
    for (const { doc: added, docR: removed, name: event } of events) {
      const a = added.find((c) => c.event === event)
      const r = removed.find((c) => c.event === event)
      assert.true(
        removed.some((c) => c.event === event),
        `${event} listener should be removed`
      )
      assert.true(r.handler === a.handler, `same ${event} handler removed as added`)
    }
    assert.true(hoverSpy.clearCalled, 'Hover.clear should be called on destroy')
  } finally {
    cleanupAppAndRestore(config, restore, { restoreHoverClear: hoverSpy.original })
  }
})

test('Key input clears hover when enableMouse is true', async (assert) => {
  const { config, docAdded, restore } = await runApplicationInit(true)
  const keydown = getKeydown(docAdded)
  assert.true(keydown !== undefined, 'keydown listener should be registered')
  const hoverSpy = spyHoverClear()
  try {
    Hover.set(createComponent('comp1'))
    await keydown.handler(keyEvent('ArrowDown', 40))
    assert.true(
      hoverSpy.clearCalled,
      'Hover.clear should be called on key input when enableMouse is true'
    )
  } finally {
    cleanupAppAndRestore(config, restore, { restoreHoverClear: hoverSpy.original })
  }
})

test('Key input does NOT clear hover when enableMouse is false', async (assert) => {
  const { config, docAdded, restore } = await runApplicationInit(false)
  const keydown = getKeydown(docAdded)
  const hoverSpy = spyHoverClear()
  try {
    Hover.set(createComponent('comp1'))
    await keydown.handler(keyEvent('ArrowDown', 40))
    assert.false(hoverSpy.clearCalled, 'Hover.clear should not be called when enableMouse is false')
  } finally {
    cleanupAppAndRestore(config, restore, { restoreHoverClear: hoverSpy.original })
  }
})

test('Non-arrow key also clears hover when enableMouse is true', async (assert) => {
  const { config, docAdded, restore } = await runApplicationInit(true)
  const keydown = getKeydown(docAdded)
  const hoverSpy = spyHoverClear()
  try {
    Hover.set(createComponent('comp1'))
    await keydown.handler(keyEvent('a', 65))
    assert.true(
      hoverSpy.clearCalled,
      'Hover.clear should be called on any key when enableMouse is true'
    )
  } finally {
    cleanupAppAndRestore(config, restore, { restoreHoverClear: hoverSpy.original })
  }
})

test('Key input when hover already null does not throw', async (assert) => {
  const { config, docAdded, restore } = await runApplicationInit(true)
  const keydown = getKeydown(docAdded)
  Hover.clear()
  try {
    await keydown.handler(keyEvent('ArrowDown', 40))
    assert.pass('keydown handler should not throw when hover is already null')
  } finally {
    cleanupAppAndRestore(config, restore)
  }
})

test('Moving the pointer on the same node hovers it again after key input cleared the hover', async (assert) => {
  const { renderer } = await import('./launch.js')
  const { componentMap } = await import('./component.js')
  const node = {}
  const card = createComponent('card')
  componentMap.set(node, card)
  renderer.canvas = { getBoundingClientRect: () => ({ left: 0, top: 0 }) }
  renderer.stage = { getNodeFromPosition: () => node }

  const { config, docAdded, restore } = await runApplicationInit(true)
  try {
    const mousemove = docAdded.find((c) => c.event === 'mousemove')
    const keydown = getKeydown(docAdded)

    mousemove.handler({ timeStamp: 1000, clientX: 10, clientY: 10 })
    assert.equal(Hover.get(), card, 'the pointer hovers the component under it')

    await keydown.handler(keyEvent('ArrowDown', 40))
    assert.equal(Hover.get(), null, 'key input clears the hover')

    mousemove.handler({ timeStamp: 2000, clientX: 12, clientY: 10 })
    assert.equal(Hover.get(), card, 'moving on the same component hovers it again')
  } finally {
    delete renderer.canvas
    delete renderer.stage
    cleanupAppAndRestore(config, restore)
  }
})

test('Re-init after destroy re-registers listeners', async (assert) => {
  const { config, docAdded, restore } = await runApplicationInit(true)
  const keydownHandlers = docAdded.filter((c) => c.event === 'keydown')
  assert.equal(keydownHandlers.length, 1, 'keydown registered once after first init')
  config.hooks[symbols.destroy].call(createMockApp())
  config.hooks[symbols.init].call(createMockApp())
  assert.equal(
    docAdded.filter((c) => c.event === 'keydown').length,
    keydownHandlers.length + 1,
    'one more keydown listener after re-init'
  )
  try {
    const keydownAfterReInit = docAdded.filter((c) => c.event === 'keydown').at(-1)
    await keydownAfterReInit.handler(keyEvent('ArrowDown', 40))
    assert.pass('keydown handler works after re-init')
  } finally {
    cleanupAppAndRestore(config, restore)
  }
})

// Counts the pointer moves that get past the throttle: each one emits `mouse::move`.
async function countHandledMoves(timeStamps) {
  const { default: Application } = await import('./application.js')
  Settings.set('enableMouse', true)
  const spies = createListenerSpies()
  const config = {}
  Application(config)
  let handled = 0
  const app = {
    ...createMockApp(),
    $emit: (name) => {
      if (name === 'mouse::move') handled++
    },
  }
  config.hooks[symbols.init].call(app)
  try {
    const mousemove = spies.docAdded.find((c) => c.event === 'mousemove')
    for (const timeStamp of timeStamps) mousemove.handler({ timeStamp, clientX: 0, clientY: 0 })
    return handled
  } finally {
    cleanupAppAndRestore(config, spies.restore)
  }
}

const MOVE_TIMESTAMPS = [1000, 1050, 1099, 1100, 1150]

test('Pointer moves within 100ms of the last handled move are dropped by default', async (assert) => {
  assert.equal(await countHandledMoves(MOVE_TIMESTAMPS), 2, 'only moves 100ms apart are handled')
})

test('mouseMoveThrottle setting changes the pointer move throttle window', async (assert) => {
  Settings.set('mouseMoveThrottle', 16)
  try {
    assert.equal(
      await countHandledMoves(MOVE_TIMESTAMPS),
      4,
      'moves at least 16ms apart are handled'
    )
  } finally {
    delete Settings[symbols.settings].mouseMoveThrottle
  }
})
