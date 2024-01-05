import { resolve } from 'path'
import * as fs from 'fs'

import generateBMFont from 'msdf-bmfont-xml'

export default function () {
  let config
  return {
    name: 'msdfGenerator',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    buildStart(options) {
      const fileRegex = /(.*)\.(ttf)$/
      const fontDir = resolve('public/fonts')
      const fontFiles = fs.readdirSync(fontDir)
      const ttfFonts = fontFiles.filter((file) => fileRegex.test(file))

      ttfFonts.forEach((font) => {
        const matches = fileRegex.exec(font)
        const fontName = matches[1]
        if (
          fontFiles.indexOf(`${fontName}.mdsf.json`) ||
          fontFiles.indexOf(`${fontName}.mdsf.png`)
        ) {
          generateFontFiles(fontName)
        }
      })
    },
  }
}

const generateFontFiles = () => {
  const fontFile = fs.readFileSync(font)
  // const fontOptions = {
  //   filename: fontName.name + '.msdf',
  //   outputType: 'json',
  // }

  //   generateBMFont(fontFile, fontOptions, (error, textures, font) => {
  //     if (error) throw error

  //     textures.forEach((texture) => {
  //       let image = Buffer.from(texture.texture, 'base64')
  //       fs.writeFile(resolve(outDir, `${fontName.name}.msdf.png`), image, (err) => {
  //         if (err) throw err
  //       })
  //     })

  //     fs.writeFile(resolve(outDir, font.filename), font.data, (err) => {
  //       if (err) throw err
  //     })
  //   })
  // }
}
