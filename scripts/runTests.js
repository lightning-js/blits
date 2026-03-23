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

/** @type {string[]} */
const excludeTestFiles = []

// For testing and debugging purposes only - leave empty to run all tests
// When populated, ONLY these test files will run (matches partial file paths)
/** @type {string[]} */
const manualIncludeOnlyTestFiles = []

/** @type {string[]} */
const cliIncludeOnlyTestFiles = process.argv
  .slice(2)
  .map((value) => value.trim())
  .filter(Boolean)

console.log(`CLI includeOnly patterns: ${cliIncludeOnlyTestFiles.join(', ')}`)

/** @type {string[]} */
const includeOnlyTestFiles = [...manualIncludeOnlyTestFiles, ...cliIncludeOnlyTestFiles]

try {
  // Find all *.test.js files excluding node_modules and packages
  let testFiles = await fg(['**/*.test.js', '!**/node_modules/**', '!**/packages/**'], {
    cwd: __dirname,
  })

  console.log(`Found ${testFiles.length} test files to run.`)
  testFiles.sort() // Sort first to ensure consistent ordering

  // If includeOnly is specified, filter to only those files (for debugging)
  // When includeOnly is set, exclude filters are ignored
  if (includeOnlyTestFiles.length > 0) {
    console.log(`Applying includeOnly patterns from CLI: ${includeOnlyTestFiles.join(', ')}`)
    testFiles = testFiles.filter((file) => {
      const normalizedPath = file.replace(/\\/g, '/')
      return includeOnlyTestFiles.some((pattern) => normalizedPath.includes(pattern))
    })
    console.log(
      `Filtered to ${testFiles.length} test files based on includeOnly patterns (excludes ignored).`
    )
  } else {
    // Filter out excluded test files (only applies when includeOnly is not set)
    testFiles = testFiles.filter((file) => {
      const normalizedPath = file.replace(/\\/g, '/')
      return !excludeTestFiles.some((pattern) => normalizedPath.includes(pattern))
    })
  }

  if (testFiles.length === 0) {
    console.log('No test files were found to run')
    process.exit(0)
  }

  const tapePath = resolve(__dirname, 'node_modules', 'tape', 'bin', 'tape')
  const tapDiff = process.platform === 'win32' ? 'tap-diff.cmd' : 'tap-diff'
  const tapDiffPath = resolve(__dirname, 'node_modules', '.bin', tapDiff)

  // Spawn the tape process with --unhandled-rejections=warn to prevent premature exit
  const tapeProcess = spawn('node', [
    '--unhandled-rejections=warn',
    '-r',
    'global-jsdom/register',
    tapePath,
    ...testFiles,
  ])

  let outputBuffer = ''
  let tapeExitCode = 0

  tapeProcess.stdout.on('data', (chunk) => {
    outputBuffer += chunk.toString()
  })

  // Stream stderr directly
  tapeProcess.stderr.pipe(process.stderr)

  tapeProcess.on('close', (code) => {
    // Capture the tape exit code
    tapeExitCode = code || 0

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
      // Exit with tape's exit code if tests failed, otherwise use tap-diff's code
      process.exit(tapeExitCode !== 0 ? tapeExitCode : diffCode)
    })
  })
} catch (err) {
  console.error('Error running tests:', err)
  process.exit(1)
}
