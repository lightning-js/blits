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

import { Log } from '../lib/log.js'

export default {
  name: 'audio',
  plugin(options = {}) {
    let audioContext = undefined
    let audioEnabled = true
    let activeTracks = {} // Store all active track controllers

    try {
      audioContext = new AudioContext()
    } catch (e) {
      Log.error('AudioContext is not supported or failed to initialize. Audio will be disabled.')
      audioEnabled = false
    }

    let tracks = {}

    const loadAudioData = async (url) => {
      if (audioEnabled === false) return
      try {
        const response = await fetch(url)

        if (!response.ok) {
          throw Error(`${response.status} - ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        return audioContext.decodeAudioData(arrayBuffer)
      } catch (e) {
        Log.error(`Failed to load audio from ${url}: ${e}`)
      }
    }

    const preloadTracks = async (trackList) => {
      if (audioEnabled === false) return
      for (const [key, url] of Object.entries(trackList)) {
        const audioData = await loadAudioData(url)
        if (audioData) {
          tracks[key] = audioData
        }
      }
    }

    const createTrackController = (source, gainNode, trackId) => {
      return {
        stop() {
          try {
            source.stop()
          } catch (e) {
            Log.warn('Error stopping audio track', trackId)
          }

          delete activeTracks[trackId]
        },
        setVolume(volume) {
          gainNode.gain.value = volume
        },
        get source() {
          return source
        },
        get gainNode() {
          return gainNode
        },
      }
    }

    const playAudioBuffer = (buffer, trackId, { volume = 1, pitch = 1 } = {}) => {
      if (audioEnabled === false || audioContext === undefined) {
        Log.warn('AudioContext not available. Cannot play audio.')
        return
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = pitch

      const gainNode = audioContext.createGain()
      gainNode.gain.value = volume

      source.connect(gainNode)
      gainNode.connect(audioContext.destination)

      source.onended = () => {
        delete activeTracks[trackId]
        Log.info(`Track ${trackId} finished playing.`)
      }

      // Create and store the track controller
      const trackController = createTrackController(source, gainNode, trackId)
      activeTracks[trackId] = trackController

      source.start()

      return trackController
    }

    const playTrack = (key, options = {}, trackId = key) => {
      if (audioEnabled === false) {
        Log.warn('AudioContext not available. Cannot play track.')
        return
      }
      if (tracks[key] !== undefined) {
        return playAudioBuffer(tracks[key], trackId, options)
      } else {
        Log.warn(`Track ${key} not found in the library.`)
      }
    }

    const playUrl = async (url, options = {}, trackId = url) => {
      if (audioEnabled === false) return
      const audioData = await loadAudioData(url)
      if (audioData !== undefined) {
        return playAudioBuffer(audioData, trackId, options)
      }
    }

    const stop = (trackId) => {
      if (audioEnabled === false || activeTracks[trackId] === undefined) return
      activeTracks[trackId].stop()
    }

    const stopAll = () => {
      if (audioEnabled === false) return
      while (Object.keys(activeTracks).length > 0) {
        const trackId = Object.keys(activeTracks)[0]
        stop(trackId)
      }
    }

    const removeTrack = (key) => {
      if (tracks[key] !== undefined) {
        // stop if the track happens to be active as well
        if (activeTracks[key] !== undefined) {
          activeTracks[key].stop()
        }

        delete tracks[key]
        Log.info(`Track ${key} removed from the preloaded library.`)
      } else {
        Log.warn(`Track ${key} not found in the library.`)
      }
    }

    const destroy = () => {
      if (audioEnabled === false) return
      stopAll() // Stop all active tracks before destroying
      audioContext.close()
    }

    if (options.preload === true && audioEnabled === true) {
      preloadTracks(options.preload)
    }

    // Public API for the Audio Plugin
    return {
      get audioEnabled() {
        return audioEnabled
      },
      get activeTracks() {
        return activeTracks
      },
      get tracks() {
        return tracks
      },
      get state() {
        return audioContext.state
      },
      destroy, // Destroy the audio context and stop all tracks
      pause() {
        return audioContext.suspend()
      },
      playTrack, // Play a preloaded track by its key and return the track controller
      playUrl, // Play a track directly from a URL and return the track controller
      preload: preloadTracks, // Preload a set of audio tracks
      resume() {
        return audioContext.resume()
      },
      removeTrack, // Remove a track from the preloaded library
      stop, // Stop a specific track by its ID
      stopAll, // Stop all active tracks
    }
  },
}
