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

import test from 'tape'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const scriptPath = fileURLToPath(new URL('./validate-release.js', import.meta.url))

function runValidator({
  tag = 'v1.2.3',
  packageVersion = '1.2.3',
  lockVersion = packageVersion,
  changelog = `# Changelog

# 1.2.3

_27 nov 2026_

- Fixed a release issue

# 1.2.2

- Previous change
`,
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blits-release-'))

  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ version: packageVersion })
  )
  fs.writeFileSync(
    path.join(directory, 'package-lock.json'),
    JSON.stringify({ packages: { '': { version: lockVersion } } })
  )
  fs.writeFileSync(path.join(directory, 'CHANGELOG.md'), changelog)

  const result = spawnSync(process.execPath, [scriptPath, tag], {
    cwd: directory,
    encoding: 'utf8',
  })
  const notesPath = path.join(directory, 'release-notes.md')
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf8') : null

  fs.rmSync(directory, { recursive: true, force: true })

  return { ...result, notes }
}

test('validate-release - validates a release and writes changelog notes', (assert) => {
  const result = runValidator()

  assert.equal(result.status, 0, 'Should validate a matching release')
  assert.equal(
    result.notes,
    '_27 nov 2026_\n\n- Fixed a release issue\n',
    'Should write notes for the requested version only'
  )
  assert.end()
})

test('validate-release - rejects invalid semantic version tags', (assert) => {
  const result = runValidator({ tag: 'v1.2' })

  assert.equal(result.status, 1, 'Should reject a non-semantic version tag')
  assert.match(result.stderr, /not a stable semantic version tag/, 'Should explain the failure')
  assert.end()
})

test('validate-release - rejects mismatched package versions', (assert) => {
  const result = runValidator({ packageVersion: '1.2.4' })

  assert.equal(result.status, 1, 'Should reject a mismatched package version')
  assert.match(result.stderr, /package\.json contains 1\.2\.4/, 'Should explain the mismatch')
  assert.end()
})

test('validate-release - rejects missing changelog entries', (assert) => {
  const result = runValidator({
    changelog: '# Changelog\n\n# 1.2.2\n\n- Previous change\n',
  })

  assert.equal(result.status, 1, 'Should reject a missing changelog entry')
  assert.match(result.stderr, /must contain exactly one/, 'Should explain the missing entry')
  assert.end()
})
