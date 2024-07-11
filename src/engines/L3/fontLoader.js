import { SdfTrFontFace, WebTrFontFace } from '@lightningjs/renderer'
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
        new SdfTrFontFace(font.type, {
          fontFamily: font.family,
          descriptors: {},
          atlasUrl: font.png,
          atlasDataUrl: font.json,
          stage,
          metrics: font.metrics,
        })
      )
    } else if (font.type === 'web') {
      stage.fontManager.addFontFace(
        new WebTrFontFace({
          fontFamily: font.family,
          fontUrl: font.file,
          descriptors: {},
          metrics: font.metrics,
        })
      )
    }
  })
}
