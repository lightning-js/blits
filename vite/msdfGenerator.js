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
            const fontFile = path.join(fontDir, `${fontName}.ttf`)

            if (fs.existsSync(fontFile)) {
              const generatedFontFile = path.join(
                msdfOutputDir,
                fontPath,
                `${fontName}.msdf.${ext}`
              )
              const mimeType = ext === 'png' ? 'image/png' : 'application/json'

              await fontGenerationQueue.enqueue(async () => {
                if (isGenerationRequired(fontDir, targetDir, fontName)) {
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
              next() // ttf file does not exist
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
      const ttfFiles = findAllTtfFiles(publicDir)

      for (const ttfFile of ttfFiles) {
        const relativePath = path.relative(publicDir, path.dirname(ttfFile))
        const baseName = path.basename(ttfFile).replace(/\.ttf$/i, '')
        const targetDir = path.join(msdfOutputDir, relativePath)

        // Check MSDF generation is required
        if (isGenerationRequired(path.dirname(ttfFile), targetDir, baseName)) {
          const configFilePath = path.join(path.dirname(ttfFile), `${baseName}.config.json`)
          console.log(`Generating missing MSDF files for ${ttfFile}`)
          await generateSDF(ttfFile, path.join(msdfOutputDir, relativePath), configFilePath)

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

// finds all TTF files in a directory
const findAllTtfFiles = (dir, filesList = []) => {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  files.forEach((file) => {
    if (file.isDirectory()) {
      const dirPath = path.join(dir, file.name)
      findAllTtfFiles(dirPath, filesList)
    } else {
      // Check for all case variations of TTF extension
      if (file.name.match(/\.ttf$/i)) {
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

// Check font config.json or ttf file modified since last generation
const isGenerationRequired = (ttfDir, targetDir, fontName) => {
  const ttfFilePath = path.resolve(ttfDir, fontName + '.ttf')
  const ttfChecksumPath = path.resolve(targetDir, fontName + '.ttf.checksum')

  const configJsonPath = path.resolve(ttfDir, fontName + '.config.json')
  const configChecksumPath = path.resolve(targetDir, fontName + '.config.checksum')

  // If ttf file checksum not exists, should generate msdf
  if (!fs.existsSync(ttfChecksumPath)) {
    checksumPaths.push(ttfChecksumPath)
    checksumData.push(generateHash(ttfFilePath))

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

  // Check .ttf file modified, if modified, should generate msdf
  return isInputFileModified(ttfFilePath, ttfChecksumPath)
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
