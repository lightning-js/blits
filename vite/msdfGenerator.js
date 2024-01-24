import { resolve as pathResolve } from 'path'
import * as fs from 'fs'
import generateBMFont from 'msdf-bmfont-xml'

let config

export default function () {
  return {
    name: 'msdfGenerator',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async configureServer(server) {
      server.middlewareMode = true
      const fontDir = pathResolve(getConfig('path', 'public/fonts'))

      // intercept only /fonts/ requests
      server.middlewares.use('/fonts/', async (req, res, next) => {
        const file = req.url.substring(req.url.lastIndexOf('/') + 1)
        const match = file.match(/(.+)\.msdf\.(json|png)/)

        if (match) {
          if (!fs.existsSync(pathResolve(fontDir, file))) {
            const fontName = match[1]
            const ext = match[2]
            const fontFile = `${fontDir}/${fontName}.ttf`

            if (fs.existsSync(fontFile)) {
              const generatedFontFile = pathResolve(`.tmp/${fontName}.msdf.${ext}`)
              const mimeType = ext === 'png' ? 'image/png' : 'application/json'

              if (!fs.existsSync(generatedFontFile)) {
                await generateFont(fontFile, '.tmp', fontName)
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
  }
}

const getConfig = (key, defaultValue) => {
  console.log('getConfig', key, defaultValue)
  if (!config.blits || !config.blits.fonts) return defaultValue
  else {
    return key in config.blits.fonts ? config.blits.fonts[key] : defaultValue
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
              fs.writeFileSync(pathResolve(fontDir, `${fontName}.msdf.png`), texture.texture)
            } catch (e) {
              console.error(e)
              reject(e)
            }
          })
          try {
            fs.writeFileSync(pathResolve(fontDir, `${fontName}.msdf.json`), font.data)
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
