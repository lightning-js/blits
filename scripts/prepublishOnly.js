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
import compiler from './compiler.js'
import { exec } from 'child_process'

const currentDir = process.cwd()
const targetDir = path.resolve(currentDir, 'src')
const componentDirs = ['src/components']

function precompileComponents(directory) {
  console.log(`Checking files in ${directory} for components to precompile`)
  const files = fs.readdirSync(directory)

  for (const file of files) {
    const filePath = path.join(directory, file)
    const filePathRelative = path.relative(currentDir, filePath)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      if (componentDirs.includes(filePathRelative)) {
        precompileComponents(filePath)
      }
    } else if (
      componentDirs.includes(path.dirname(filePathRelative)) &&
      (file.endsWith('.js') || file.endsWith('.ts'))
    ) {
      const source = fs.readFileSync(filePath, 'utf-8')
      const newSource = compiler(source, filePath)
      fs.writeFileSync(filePath, newSource)

      // only format the file if it was changed
      if (source !== newSource) {
        formatFileWithESLint(filePath)
      }
    }
  }

  console.log('Finished processing files suitable for precompilation')
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

precompileComponents(targetDir)
