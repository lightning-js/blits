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

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import compiler from '../src/lib/precompiler/precompiler.js'
import { exec } from 'child_process'

const currentDir = process.cwd()
const componentDirs = ['src/components']

function precompileComponents() {
  for (const dir of componentDirs) {
    const fullDir = path.resolve(currentDir, dir)
    console.log(`Checking files in ${fullDir} for components to precompile`)
    processDirectory(fullDir)
  }
  console.log('Finished processing files suitable for precompilation')
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory)

  for (const file of files) {
    const filePath = path.join(directory, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (/^(?!.*\.orig\.(js|ts)$).*\.(js|ts)$/.test(file)) {
      // only process files that don't end in .orig.js or .orig.ts
      processFile(filePath)
    }
  }
}

function processFile(filePath) {
  console.log(`Precompiling ${filePath}`)
  // backup the file
  const backupFilePath = filePath.replace(/\.(j|t)s$/, '.orig.$1s')
  fs.copyFileSync(filePath, backupFilePath)

  const source = fs.readFileSync(filePath, 'utf-8')
  const result = compiler(source, filePath)

  // Handle both string and object return types
  const newSource = typeof result === 'object' && result.code ? result.code : result
  fs.writeFileSync(filePath, newSource)

  // only format the file if it was changed
  if (source !== newSource) {
    formatFileWithESLint(filePath)
  }
}

function formatFileWithESLint(filePath) {
  const command = `eslint "${filePath}" --fix`

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution Error: ${error.message}`)
      console.error(`Exit Code: ${error.code}`)
    }
    if (stderr) {
      console.error(`ESLint Error: ${stderr}`)
    }
    if (stdout) {
      console.log(`ESLint Output: ${stdout}`)
    }
  })
}

// Only run if this file is executed directly (not imported)
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  precompileComponents()
}

export { precompileComponents, processDirectory, processFile, formatFileWithESLint }
