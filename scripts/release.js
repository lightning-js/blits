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

import { execSync } from 'child_process'

// Stash any new (untracked) and modified files so they are not accidentally
// included in the published package, publish, then always pop the stash back so
// the working tree is restored whether the publish succeeded or failed.

// Stash new and modified files, reporting whether a stash entry was created
function stashChanges() {
  // --include-untracked stashes both modified tracked files and new untracked files
  const output = execSync('git stash push --include-untracked', { encoding: 'utf8' })
  const stashed = !output.includes('No local changes to save')

  if (stashed) {
    console.log('Stashed new and modified files before publish.')
  } else {
    console.log('Nothing to stash. Working tree is already clean.')
  }

  return stashed
}

// Stash new and modified files before publishing
const didStash = stashChanges()

try {
  console.log('Publishing package to npm...\n')
  execSync('npm publish --access public', { stdio: 'inherit' })
  console.log('\nPackage published successfully.')
} catch (err) {
  console.error(`\nnpm publish failed. The release did not complete.\n${err.message}`)
  process.exitCode = 1
} finally {
  // Always restore the stashed files, whether the publish succeeded or failed
  if (didStash) {
    console.log('Restoring stashed files...')
    execSync('git stash pop', { stdio: 'inherit' })
  }
}
