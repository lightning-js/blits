import path from 'path'
import * as fs from 'fs'
import generateBMFont from 'msdf-bmfont-xml'

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
      msdfOutputDir = path.resolve(config.root, 'node_modules', '.tmp-msdf-fonts')
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

              if (!fs.existsSync(generatedFontFile)) {
                console.log(`\nGenerating ${targetDir}/${fontName}.msdf.${ext}`)
                await generateFont(fontFile, targetDir, fontName)
              }

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
      // Find all TTF files under publicDir
      const ttfFiles = findAllTtfFiles(publicDir)

      for (const ttfFile of ttfFiles) {
        const relativePath = path.relative(publicDir, path.dirname(ttfFile))
        const baseName = path.basename(ttfFile).replace(/\.ttf$/i, '')
        const msdfJsonPath = path.join(msdfOutputDir, relativePath, `${baseName}.msdf.json`)
        const msdfPngPath = path.join(msdfOutputDir, relativePath, `${baseName}.msdf.png`)

        // Check if MSDF files are generated, if not, generate them
        if (!fs.existsSync(msdfJsonPath) || !fs.existsSync(msdfPngPath)) {
          console.log(`Generating missing MSDF files for ${ttfFile}`)
          await generateFont(ttfFile, path.join(msdfOutputDir, relativePath), baseName)
        }
      }

      if (fs.existsSync(msdfOutputDir)) {
        copyDir(msdfOutputDir, buildOutputPath)
      }
    },
  }
}

const generateFont = (fontFile, fontDir, fontName) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fontDir)) {
      fs.mkdirSync(fontDir, { recursive: true })
    }
    generateBMFont(
      fontFile,
      {
        outputType: 'json',
      },
      (err, textures, font) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          textures.forEach((texture) => {
            try {
              fs.writeFileSync(path.resolve(fontDir, `${fontName}.msdf.png`), texture.texture)
            } catch (e) {
              console.error(e)
              reject(e)
            }
          })
          try {
            fs.writeFileSync(path.resolve(fontDir, `${fontName}.msdf.json`), font.data)
            resolve()
          } catch (e) {
            console.error(err)
            reject(e)
          }
        }
      }
    )
  })
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

    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath) // Copy files
  }
}
