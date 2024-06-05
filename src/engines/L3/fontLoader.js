import { WebTrFontFace, SdfTrFontFace } from '@lightningjs/renderer'

import Settings from '../../settings.js'
import { renderer } from './launch.js'

export default () => {
  const stage = renderer.stage
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
        new SdfTrFontFace('msdf', {
          fontFamily: font.family,
          descriptors: {},
          atlasUrl: font.png,
          atlasDataUrl: font.json,
          stage,
          // Instead of suppling `metrics` this font will rely on the ones
          // encoded in the json file under `lightningMetrics`.
        }),
      )
    } else if (font.type === 'web') {
      stage.fontManager.addFontFace(new WebTrFontFace(font.family, {}, font.file))
    }
  })
}
