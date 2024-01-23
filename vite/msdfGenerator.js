import { resolve as pathResolve } from 'path'
import * as fs from 'fs'

import sequence from '../src/helpers/sequence.js'

import generateBMFont from 'msdf-bmfont-xml'
let config

export default function () {
  return {
    name: 'msdfGenerator',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    buildStart() {
      if (getConfig('enabled', true) === false) return

      const fileRegex = /(.*)\.(ttf)$/
      const fontDir = pathResolve(getConfig('path', 'public/fonts'))
      const fontFiles = fs.readdirSync(fontDir)

      const ttfFonts = fontFiles.filter((file) => fileRegex.test(file))

      return sequence(
        ttfFonts.map((font) => {
          return () =>
            new Promise((resolve, reject) => {
              const matches = fileRegex.exec(font)
              const fontName = matches[1]
              if (
                fontFiles.indexOf(`${fontName}.msdf.json`) === -1 ||
                fontFiles.indexOf(`${fontName}.msdf.png`) === -1
              ) {
                console.log('Generating MSDF font for ', fontName)
                generateBMFont(
                  pathResolve(fontDir, font),
                  {
                    outputType: 'json',
                  },
                  (err, textures, font) => {
                    if (err) {
                      return reject(err)
                    } else {
                      textures.forEach((texture) => {
                        try {
                          fs.writeFileSync(
                            pathResolve(fontDir, `${fontName}.msdf.png`),
                            texture.texture
                          )
                        } catch (e) {
                          return reject(e)
                        }
                      })
                      try {
                        fs.writeFileSync(pathResolve(fontDir, `${fontName}.msdf.json`), font.data)
                      } catch (e) {
                        return reject(e)
                      }
                      resolve()
                    }
                  }
                )
              } else {
                resolve()
              }
            })
        })
      )
    },
  }
}

const getConfig = (key, defaultValue) => {
  if (!config.blits || !config.blits.fonts) return defaultValue
  else {
    return key in config.blits.fonts ? config.blits.fonts[key] : defaultValue
  }
}
