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
    configureServer(server) {
      server.middlewares.use('/', (req, res, next) => {
        const file = req.url.substring(req.url.lastIndexOf('/') + 1)
        const fontDir = pathResolve(getConfig('path', 'public/fonts'))

        const match = file.match(/(.+)\.msdf\.(json|png)/)
        if (match) {
          if (fs.existsSync(pathResolve(fontDir, file))) {
            next()
          } else {
            const fontName = match[1]
            const ext = match[2]
            const fontFile = `${fontDir}/${fontName}.ttf`
            if (fs.existsSync(fontFile)) {
              generateFont(fontFile, '.tmp', fontName, () => {
                req.url = pathResolve(`.tmp/${fontName}.${ext}`)
                next()
              })
            } else {
              next()
            }
          }
        } else {
          next()
        }
      })
    },
  }
}

const getConfig = (key, defaultValue) => {
  if (!config.blits || !config.blits.fonts) return defaultValue
  else {
    return key in config.blits.fonts ? config.blits.fonts[key] : defaultValue
  }
}

const generateFont = (fontFile, fontDir, fontName, cb) => {
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
      } else {
        textures.forEach((texture) => {
          try {
            fs.writeFileSync(pathResolve(fontDir, `${fontName}.msdf.png`), texture.texture)
          } catch (e) {
            console.error(e)
          }
        })
        try {
          fs.writeFileSync(pathResolve(fontDir, `${fontName}.msdf.json`), font.data)
        } catch (e) {
          console.error(err)
        }
        cb()
      }
    }
  )
}
