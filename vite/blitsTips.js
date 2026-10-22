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
 */

const tips = ['tip1', 'tip2', 'tip3']

let hmrCount = 0
let lastTipLines = 0
const HMR_THRESHOLD = 4

function showTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)]

  // Clear previous tip (move up and erase lines)
  if (lastTipLines > 0) {
    process.stdout.write(`\x1B[${lastTipLines}A`)
    for (let i = 0; i < lastTipLines; i++) {
      process.stdout.write('\x1B[2K\x1B[1E') // clear line + move down
    }
    process.stdout.write(`\x1B[${lastTipLines}A`)
  }

  // Print new tip
  const lines = [`💡 Blits Tip: ${tip}`, '']
  lastTipLines = lines.length
  process.stdout.write(lines.join('\n') + '\n')
}

export default function blitsTipsPlugin() {
  return {
    name: 'vite:blits-tips',
    apply: 'serve',

    configureServer(server) {
      server.watcher.on('change', () => {
        hmrCount++
        if (hmrCount >= HMR_THRESHOLD) {
          showTip()
          hmrCount = 0
        }
      })
    },
  }
}
