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
        new SdfTrFontFace(font.type, {
          fontFamily: font.family,
          descriptors: {},
          atlasUrl: font.png,
          atlasDataUrl: font.json,
          stage,
          ...(font.metrics ? { metrics: font.metrics } : {}),
        })
      )
    } else if (font.type === 'web') {
      stage.fontManager.addFontFace(
        new WebTrFontFace({
          fontFamily: font.family,
          fontUrl: font.file,
          descriptors: {},
          ...(font.metrics ? { metrics: font.metrics } : {}),
        })
      )
    }
  })
}
