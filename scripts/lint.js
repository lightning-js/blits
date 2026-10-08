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

import fg from 'fast-glob'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { ESLint } from 'eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '../..')

// Get "fix" flag from command line arguments
const isFix = process.argv[2] === 'fix'

console.log('Starting the linting process...')
console.log(`Fix mode is ${isFix ? 'enabled' : 'disabled'}`)

const lintFiles = await fg(['**/*.js', '!node_modules/**'], {
  cwd: __dirname,
})

console.log(`Found ${lintFiles.length} JavaScript file(s) to lint.`)

if (lintFiles.length === 0) {
  console.log('No JavaScript files found to lint.')
  process.exit(0)
}

const lint = new ESLint({
  fix: isFix,
  cwd: __dirname,
})

const results = await lint.lintFiles(lintFiles)

// Apply fixes to files if "fix" option is enabled
if (isFix) {
  await ESLint.outputFixes(results)
}

const formatter = await lint.loadFormatter('stylish')
const resultText = formatter.format(results)

if (resultText) {
  console.log(resultText)
} else {
  console.log('Linting complete: All files passed without issues.')
}

// Determine if there were any errors (not warnings)
const hasErrors = results.some((result) => result.errorCount > 0)

process.exit(hasErrors ? 1 : 0)
