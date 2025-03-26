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

import test from 'tape'
import audio from './audio.js'
import { initLog } from '../lib/log.js'
import Settings from '../settings.js'

// Enable debug logging
Settings.set('debugLevel', 4)
initLog()

// Mock AudioContext and its methods
class MockAudioContext {
  constructor() {
    this.state = 'suspended'
  }

  resume() {
    this.state = 'running'
  }

  suspend() {
    this.state = 'suspended'
  }

  decodeAudioData(buffer) {
    return buffer
  }

  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      playbackRate: { value: 1 },
      onended: null,
    }
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: () => {},
    }
  }

  close() {
    return Promise.resolve()
  }
}

// Mock some globals
global.window = {
  console,
}
global.AudioContext = MockAudioContext
global.fetch = () =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })

test('Audio Plugin - Initialization', (assert) => {
  const plugin = audio.plugin()
  assert.equal(plugin.audioEnabled, true, 'Audio should be enabled if AudioContext is available')
  assert.end()
})

test('Audio Plugin - Preload tracks', async (assert) => {
  const plugin = audio.plugin()
  await plugin.preload({
    track1: '/audio/track1.wav',
    track2: '/audio/track2.wav',
  })
  assert.pass('Tracks should preload without errors')
  assert.end()
})

test('Audio Plugin - Play a preloaded track', async (assert) => {
  const plugin = audio.plugin()

  await plugin.preload({
    track1: '/audio/track1.wav',
  })

  const track = plugin.playTrack('track1', { volume: 0.5 }, 'track1')
  assert.equal(plugin.getActiveTrackById('track1') !== null, true, 'Active track should exist')

  assert.ok(track.stop, 'Track controller should have stop method')
  assert.end()
})

test('Audio Plugin - Play a track from URL', async (assert) => {
  const plugin = audio.plugin()

  const track = await plugin.playUrl('/audio/test.wav', { volume: 0.8 })
  assert.equal(
    plugin.getActiveTrackById('/audio/test.wav') !== null,
    true,
    'Active track should exist'
  )

  assert.ok(track.stop, 'Track controller should have stop method')
  assert.end()
})

test('Audio Plugin - Pause, Resume, and Stop', async (assert) => {
  const plugin = audio.plugin()

  await plugin.preload({
    track1: '/audio/track1.wav',
  })

  const track = plugin.playTrack('track1', { volume: 0.5 }, 'track1')
  assert.equal(plugin.getActiveTrackById('track1') !== null, true, 'Active track should exist')

  // Pause
  plugin.pause()
  assert.equal(plugin.state === 'suspended', true, 'Track should pause successfully')

  // Resume
  plugin.resume()
  assert.equal(plugin.state === 'running', true, 'Track should resume successfully')

  // Stop
  track.stop()
  assert.equal(
    plugin.getActiveTrackById('track1'),
    null,
    'Track should be removed from active tracks after stopping'
  )
  assert.pass('Track should stop successfully')
  assert.end()
})

test('Audio Plugin - Stop all tracks', async (assert) => {
  const plugin = audio.plugin()

  await plugin.preload({
    track1: '/audio/track1.wav',
    track2: '/audio/track2.wav',
  })

  plugin.playTrack('track1', { volume: 0.5 }, 'track1')
  plugin.playTrack('track2', { volume: 0.5 }, 'track2')

  assert.equal(
    plugin.getActiveTrackById('track1') !== null && plugin.getActiveTrackById('track2') !== null,
    true,
    'Both tracks should be playing'
  )

  plugin.stopAll()

  assert.equal(
    plugin.getActiveTrackById('track1') === null && plugin.getActiveTrackById('track2') === null,
    true,
    'Both tracks should be stopped'
  )
  assert.pass('All tracks should stop successfully')
  assert.end()
})

test('Audio Plugin - Remove a preloaded track', async (assert) => {
  const plugin = audio.plugin()

  await plugin.preload({
    track1: '/audio/track1.wav',
  })

  plugin.removeTrack('track1')

  const preloadedTracks = plugin.tracks

  assert.equal(preloadedTracks.track1, undefined, 'Track 1 should be removed from preloaded Tracks')
  assert.equal(plugin.playTrack('track1'), null, 'Preloaded track should be removed')
  assert.end()
})

test('Audio Plugin - Destroy the plugin', async (assert) => {
  const plugin = audio.plugin()

  await plugin.preload({
    track1: '/audio/track1.wav',
  })

  plugin.destroy()

  assert.pass('Plugin should destroy and stop all tracks')
  assert.end()
})
