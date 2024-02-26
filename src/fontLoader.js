import { CoreExtension, WebTrFontFace, SdfTrFontFace } from '@lightningjs/renderer/core'

import Settings from './settings'
export default class FontLoader extends CoreExtension {
  async run(stage) {
    Settings.get('fonts', []).forEach((font) => {
      if (font.type === 'sdf' || font.type === 'msdf') {
        stage.fontManager.addFontFace(
          new SdfTrFontFace(font.family, {}, font.type, stage, font.png, font.json)
        )
      } else if (font.type === 'web') {
        stage.fontManager.addFontFace(new WebTrFontFace(font.family, {}, font.file))
      }
    })
  }
}
