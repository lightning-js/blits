import path from 'path'
import * as fs from 'fs'
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
            for (const fontExt of supportedExtensions) {
              const potentialPath = path.join(fontDir, `${fontName}.${fontExt}`)
              if (fs.existsSync(potentialPath)) {
                fontFile = potentialPath
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
                if (!fs.existsSync(generatedFontFile)) {
                  // Check if generation is needed
                  console.log(`\nGenerating ${targetDir}/${fontName}.msdf.${ext}`)
                  await generateSDF(fontFile, path.join(targetDir))
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
        const baseName = path.basename(fontFile).replace(/\.(ttf|otf|woff)$/i, '')
        const msdfJsonPath = path.join(msdfOutputDir, relativePath, `${baseName}.msdf.json`)
        const msdfPngPath = path.join(msdfOutputDir, relativePath, `${baseName}.msdf.png`)

        // Check if MSDF files are generated, if not, generate them
        if (!fs.existsSync(msdfJsonPath) || !fs.existsSync(msdfPngPath)) {
          console.log(`Generating missing MSDF files for ${fontFile}`)
          await generateSDF(fontFile, path.join(msdfOutputDir, relativePath))
        }
      }

      if (fs.existsSync(msdfOutputDir)) {
        copyDir(msdfOutputDir, buildOutputPath)
      }
    },
  }
}

const generateSDF = async (inputFilePath, outputDirPath) => {
  // Ensure the destination directory exists
  fs.mkdirSync(outputDirPath, { recursive: true })

  setGeneratePaths(path.dirname(inputFilePath), outputDirPath)

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

    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath) // Copy files
  }
}
