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

import fs from 'fs'

const tag = process.argv[2] || process.env.GITHUB_REF_NAME
const stableSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function fail(message) {
  console.error(`Release validation failed: ${message}`)
  process.exit(1)
}

if (!tag || !tag.startsWith('v')) {
  fail('the release tag must have the form vMAJOR.MINOR.PATCH')
}

const version = tag.slice(1)
if (!stableSemver.test(version)) {
  fail(`"${tag}" is not a stable semantic version tag`)
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))

if (packageJson.version !== version) {
  fail(`package.json contains ${packageJson.version}, expected ${version}`)
}

if (packageLock.packages?.['']?.version !== version) {
  fail(`package-lock.json does not contain version ${version}`)
}

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8')
const lines = changelog.split('\n')
const versionHeading = `# ${version}`
const versionHeadings = lines.reduce((indices, line, index) => {
  if (/^# (0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(line)) {
    indices.push({ index, line })
  }
  return indices
}, [])
const matchingHeadings = versionHeadings.filter(({ line }) => line === versionHeading)

if (matchingHeadings.length !== 1) {
  fail(`CHANGELOG.md must contain exactly one "# ${version}" heading`)
}

const headingIndex = matchingHeadings[0].index
const nextHeading = versionHeadings.find(({ index }) => index > headingIndex)
const notes = lines
  .slice(headingIndex + 1, nextHeading?.index)
  .join('\n')
  .trim()

if (!notes) {
  fail(`CHANGELOG.md section for ${version} is empty`)
}

fs.writeFileSync('release-notes.md', `${notes}\n`)
console.log(`Release ${version} validated`)
