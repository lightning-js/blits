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

import path from 'path'
import * as fs from 'fs'
import { createHash } from 'crypto'
import { genFont, setGeneratePaths } from '@lightningjs/msdf-generator'
import { adjustFont } from '@lightningjs/msdf-generator/adjustFont'

class TaskQueue {
  constructor() {
    this.currentTask = Promise.resolve()
  }

  async enqueue(task) {
    // Wait for the current task to complete before starting a new one
    this.currentTask = this.currentTask.then(task, this.handleError)
    await this.currentTask
  }

  handleError(error) {
    console.error('Error during task execution:', error)
  }
}

const fontGenerationQueue = new TaskQueue()
let config
let checksumPaths = []
let checksumData = []

export default function () {
  let msdfOutputDir = ''
  let buildOutputPath = ''
  let publicDir = ''

  return {
    name: 'msdfGenerator',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      buildOutputPath = config.build.outDir
      publicDir = path.join(config.root, 'public')
      msdfOutputDir = path.resolve(config.root, 'node_modules', '.tmp-msdf-fonts-v2')
    },
    async configureServer(server) {
      server.middlewareMode = true
      server.middlewares.use('/', async (req, res, next) => {
        const file = req.url.substring(req.url.lastIndexOf('/') + 1)
        const match = file.match(/(.+)\.msdf\.(json|png)/)
        // msdf font request
        if (match) {
          const fontPath = path.dirname(req.url.split('?')[0]).replace(/^\//, '')
          const fontDir = path.join(publicDir, fontPath) // actual font directory
          const targetDir = path.join(msdfOutputDir, fontPath) // target for generated fonts

          if (!fs.existsSync(path.resolve(fontDir, file))) {
            const fontName = match[1]
            const ext = match[2]

            // Attempt to find the font file with supported extensions
            const supportedExtensions = ['ttf', 'otf', 'woff']
            let fontFile = null
            let fontType = null
            for (const fontExt of supportedExtensions) {
              const potentialPath = path.join(fontDir, `${fontName}.${fontExt}`)
              if (fs.existsSync(potentialPath)) {
                fontFile = potentialPath
                fontType = '.' + fontExt
                break
              }
            }

            if (fontFile) {
              const generatedFontFile = path.join(
                msdfOutputDir,
                fontPath,
                `${fontName}.msdf.${ext}`
              )
              const mimeType = ext === 'png' ? 'image/png' : 'application/json'

              await fontGenerationQueue.enqueue(async () => {
                if (isGenerationRequired(fontDir, targetDir, fontName, fontType)) {
                  const configFilePath = path.join(fontDir, `${fontName}.config.json`)

                  console.log(`\nGenerating ${targetDir}/${fontName}.msdf.${ext}`)
                  await generateSDF(fontFile, path.join(targetDir), configFilePath)

                  saveChecksum()
                }
              })

              if (fs.existsSync(generatedFontFile)) {
                const fileContent = fs.readFileSync(generatedFontFile)

                // Check if headers have already been sent
                if (!res.headersSent) {
                  res.setHeader('Content-Type', mimeType)
                  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
                  res.end(fileContent)
                } else {
                  // this should never happen except some edge cases
                  console.error(`ERROR: Headers already sent for ${req.url}`, res.getHeaders())
                }
              } else {
                next() // Handle case where generation might have failed
              }
            } else {
              next() // No supported font file found
            }
          } else {
            next() // file exists
          }
        } else {
          next() // not msdf.json or msdf.png
        }
      })
    },
    // after build ends, the first hook is renderStart where we can modify the output
    async renderStart() {
      const fontFiles = findAllFontFiles(publicDir)

      for (const fontFile of fontFiles) {
        const relativePath = path.relative(publicDir, path.dirname(fontFile))
        const fontExt = path.extname(fontFile)
        const baseName = path.basename(fontFile).replace(/\.(ttf|otf|woff)$/i, '')
        const targetDir = path.join(msdfOutputDir, relativePath)

        // Check MSDF generation is required
        if (isGenerationRequired(path.dirname(fontFile), targetDir, baseName, fontExt)) {
          const configFilePath = path.join(path.dirname(fontFile), `${baseName}.config.json`)
          console.log(`Generating missing MSDF files for ${fontFile}`)
          await generateSDF(fontFile, path.join(msdfOutputDir, relativePath), configFilePath)

          saveChecksum()
        }
      }

      if (fs.existsSync(msdfOutputDir)) {
        copyDir(msdfOutputDir, buildOutputPath)
      }
    },
  }
}

const generateSDF = async (inputFilePath, outputDirPath, configFilePath) => {
  // Ensure the destination directory exists
  fs.mkdirSync(outputDirPath, { recursive: true })

  setGeneratePaths(path.dirname(inputFilePath), outputDirPath, configFilePath)

  let font = await genFont(path.basename(inputFilePath), 'msdf')

  if (font) await adjustFont(font)
  else console.error('Failed to generate MSDF file')
}

// Finds all font files (.ttf, .otf, .woff) in a directory
const findAllFontFiles = (dir, filesList = []) => {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  files.forEach((file) => {
    if (file.isDirectory()) {
      const dirPath = path.join(dir, file.name)
      findAllFontFiles(dirPath, filesList)
    } else {
      // Check for supported font extensions
      if (file.name.match(/\.(ttf|otf|woff)$/i)) {
        filesList.push(path.join(dir, file.name))
      }
    }
  })

  return filesList
}

const copyDir = (src, dest) => {
  // Ensure the destination directory exists
  fs.mkdirSync(dest, { recursive: true })

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    // Should not copy .checksum files to dist directory
    if (srcPath.indexOf('.checksum') !== -1) continue

    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath) // Copy files
  }
}

// Check font config.json or font file modified since last generation
const isGenerationRequired = (fontDir, targetDir, fontName, fontExt) => {
  const fontFilePath = path.resolve(fontDir, fontName + fontExt)
  const fontChecksumPath = path.resolve(targetDir, fontName + fontExt + '.checksum')

  const configJsonPath = path.resolve(fontDir, fontName + '.config.json')
  const configChecksumPath = path.resolve(targetDir, fontName + '.config.checksum')

  // If font file checksum not exists, should generate msdf
  if (!fs.existsSync(fontChecksumPath)) {
    checksumPaths.push(fontChecksumPath)
    checksumData.push(generateHash(fontFilePath))

    if (fs.existsSync(configJsonPath)) {
      checksumPaths.push(configChecksumPath)
      checksumData.push(generateHash(configJsonPath))
    }
    return true
  }

  // If config.json exists, can be newly added or modified since last generation of msdf
  if (fs.existsSync(configJsonPath)) {
    // If config.json checksum not exists, should generate msdf
    if (!fs.existsSync(configChecksumPath)) {
      checksumPaths.push(configChecksumPath)
      checksumData.push(generateHash(configJsonPath))
      return true
    }
    const isConfigModified = isInputFileModified(configJsonPath, configChecksumPath)

    // If config.json is modified, should generate msdf
    if (isConfigModified) return true
  }

  // Check font file modified, if modified, should generate msdf
  return isInputFileModified(fontFilePath, fontChecksumPath)
}

const isInputFileModified = (inputFilePath, targetFilePath) => {
  const inputChecksum = generateHash(inputFilePath)
  const targetChecksum = fs.readFileSync(targetFilePath).toString()
  if (inputChecksum !== targetChecksum) {
    checksumPaths.push(targetFilePath)
    checksumData.push(inputChecksum)
    return true
  }
  return false
}

const generateHash = (filePath) => {
  const buffer = fs.readFileSync(filePath)
  return createHash('md5').update(buffer).digest('hex')
}

const saveChecksum = () => {
  if (checksumPaths.length > 0 && checksumData.length > 0) {
    for (let i = 0; i < checksumPaths.length; i++) {
      // Save checksum
      fs.writeFileSync(checksumPaths[i], checksumData[i])
    }
    checksumData.length = 0
    checksumPaths.length = 0
  }
}
