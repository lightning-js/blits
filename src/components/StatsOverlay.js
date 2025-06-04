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

import Component from '../component.js'
import { BLITS_STATS_ENABLED, getStats, bytesToMb } from '../lib/stats.js'
import { renderer } from '../launch.js'
import { Log } from '../lib/log.js'

/**
 * BlitsStatsOverlay
 * Renders live system and renderer stats on screen (top left corner)
 * Only displayed when BLITS_STATS_ENABLED is true
 */
export default () =>
  Component('StatsOverlay', {
    template: `
      <Element :visible="$statsEnabled">
        <Element x="5" y="5" color="black">
          <Text :content="$statsTitle" fontSize="22" fontWeight="bold" color="#fff" />
          <Element y="30">
            <Text :content="$componentStats" fontSize="18" color="#fff" />
          </Element>
          <Element y="55">
            <Text :content="$elementStats" fontSize="18" color="#fff" />
          </Element>
          <Element y="80">
            <Text :content="$listenerStats" fontSize="18" color="#fff" />
          </Element>
          <Element y="105">
            <Text :content="$timeoutStats" fontSize="18" color="#fff" />
          </Element>
          <Element y="130">
            <Text :content="$intervalStats" fontSize="18" color="#fff" />
          </Element>
          <Element y="165" :visible="$hasMemoryInfo">
            <Text :content="$memoryTitle" fontSize="22" fontWeight="bold" color="#fff" />
          </Element>
          <Element y="195" :visible="$hasMemoryInfo">
            <Text :content="$memoryStats1" fontSize="18" color="#fff" />
          </Element>
          <Element y="220" :visible="$hasMemoryInfo">
            <Text :content="$memoryStats2" fontSize="18" color="#fff" />
          </Element>
        </Element>
      </Element>
    `,
    state() {
      return {
        statsEnabled: BLITS_STATS_ENABLED,
        statsTitle: 'System Statistics',
        componentStats: 'Components: Loading...',
        elementStats: 'Elements: Loading...',
        listenerStats: 'Listeners: Loading...',
        timeoutStats: 'Timeouts: Loading...',
        intervalStats: 'Intervals: Loading...',

        hasMemoryInfo: false,
        memoryTitle: 'Renderer Memory',
        memoryStats1: '',
        memoryStats2: '',
      }
    },
    hooks: {
      ready() {
        // Only start the interval if stats are enabled
        if (BLITS_STATS_ENABLED) {
          Log.info('BlitsStatsOverlay: Starting stats update interval')
          this._interval = this.$setInterval(() => {
            this.updateStats()
          }, 500)
        }
      },
      destroy() {
        if (this._interval) {
          this.$clearInterval(this._interval)
        }
      },
    },
    methods: {
      updateStats() {
        // Skip if stats are disabled
        if (!BLITS_STATS_ENABLED) return

        // Update system stats
        const components = getStats('components')
        const elements = getStats('elements')
        const listeners = getStats('eventListeners')
        const timeouts = getStats('timeouts')
        const intervals = getStats('intervals')

        if (components) {
          this.componentStats = `Components: Active ${components.active} | Created ${components.created} | Deleted ${components.deleted}`
        }

        if (elements) {
          this.elementStats = `Elements: Active ${elements.active} | Created ${elements.created} | Deleted ${elements.deleted}`
        }

        if (listeners) {
          this.listenerStats = `Listeners: Active ${listeners.active} | Created ${listeners.created} | Deleted ${listeners.deleted}`
        }

        if (timeouts) {
          this.timeoutStats = `Timeouts: Active ${timeouts.active} | Created ${timeouts.created} | Deleted ${timeouts.deleted}`
        }

        if (intervals) {
          this.intervalStats = `Intervals: Active ${intervals.active} | Created ${intervals.created} | Deleted ${intervals.deleted}`
        }

        // Update memory info if available
        const memInfo = renderer?.stage?.txMemManager.getMemoryInfo() || null
        if (memInfo) {
          this.hasMemoryInfo = true
          this.memoryStats1 = `Memory: ${bytesToMb(memInfo.memUsed)}MB | Renderable: ${bytesToMb(
            memInfo.renderableMemUsed
          )}MB`
          this.memoryStats2 = `Target: ${bytesToMb(
            memInfo.targetThreshold
          )}MB | Critical: ${bytesToMb(memInfo.criticalThreshold)}MB`

          if (memInfo.loadedTextures !== undefined) {
            this.memoryStats2 += ` | Textures: ${memInfo.loadedTextures}`
          }
        }
      },
    },
  })
