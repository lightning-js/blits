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

import fg from 'fast-glob'
import { spawn } from 'child_process'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '../..')

try {
  // Find all *.test.js files excluding node_modules and packages
  const testFiles = await fg(['**/*.test.js', '!**/node_modules/**', '!**/packages/**'], {
    cwd: __dirname,
  })

  if (testFiles.length === 0) {
    console.log('No test files were found to run')
    process.exit(0)
  }

  const tapePath = resolve(__dirname, 'node_modules', 'tape', 'bin', 'tape')
  const tapDiff = process.platform === 'win32' ? 'tap-diff.cmd' : 'tap-diff'
  const tapDiffPath = resolve(__dirname, 'node_modules', '.bin', tapDiff)

  // Spawn the tape process
  const tapeProcess = spawn('node', ['-r', 'global-jsdom/register', tapePath, ...testFiles])

  let outputBuffer = ''

  tapeProcess.stdout.on('data', (chunk) => {
    outputBuffer += chunk.toString()
  })

  // Stream stderr directly
  tapeProcess.stderr.pipe(process.stderr)

  tapeProcess.on('close', () => {
    // Pipe the full buffered output into tap-diff
    const tapDiff = spawn(tapDiffPath, [], {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '1', //Force color output
      },
    })

    tapDiff.on('error', (err) => {
      console.error(err)
    })

    // write tape output to tap-diff input
    tapDiff.stdin.write(outputBuffer)
    tapDiff.stdin.end()

    tapDiff.stdout.on('data', (chunk) => {
      process.stdout.write(chunk) // write output to main process
    })

    tapDiff.on('close', (diffCode) => {
      if (diffCode !== 0) {
        process.exit(diffCode)
      }
    })
  })
} catch (err) {
  console.error('Error running tests:', err)
  process.exit(1)
}
