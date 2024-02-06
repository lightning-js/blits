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

const currentDir = process.cwd()
const componentDirs = ['src/components']

function precompileCleanUp() {
  for (const dir of componentDirs) {
    const fullDir = path.resolve(currentDir, dir)
    console.log(`Checking files in ${fullDir} for original files that precompiler created`)
    processDirectory(fullDir)
  }
  console.log('Finished restoring original files after precompile')
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory)

  for (const file of files) {
    const filePath = path.join(directory, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      processDirectory(filePath)
    } else if (/\.(orig\.(js|ts))$/.test(file)) {
      restoreOriginalFile(filePath)
    }
  }
}

function restoreOriginalFile(filePath) {
  const originalFilePath = filePath.replace(/\.orig\.(j|t)s$/, '.$1s')
  console.log(`Restoring original file ${originalFilePath}`)

  // Restore the original file by copying the backup file over it
  fs.copyFileSync(filePath, originalFilePath)

  // Delete the backup file
  fs.unlinkSync(filePath)
}

precompileCleanUp()
