import { WebTrFontFace, SdfTrFontFace } from '@lightningjs/renderer/core'

import Settings from '../../settings'
import { renderer } from './launch'

export default () => {
  const stage = renderer.driver.stage
  Settings.get('fonts', []).forEach((font) => {
    if (font.type === 'sdf' || font.type === 'msdf') {
      // automatically map png key to file name
      if (!font.png && font.file) {
        font.png = font.file.replace(/\.[^.]+$/, `.${font.type}.png`)
      }
      // automatically map json to file name
      if (!font.json && font.file) {
        font.json = font.file.replace(/\.[^.]+$/, `.${font.type}.json`)
      }
      stage.fontManager.addFontFace(
        new SdfTrFontFace(font.family, {}, font.type, stage, font.png, font.json)
      )
    } else if (font.type === 'web') {
      stage.fontManager.addFontFace(new WebTrFontFace(font.family, {}, font.file))
    }
  })
}
