import Settings from '../../settings.js'
import { renderer } from './launch.js'

const fontTypeMapping = {
  sdf: 'sdf',
  msdf: 'sdf',
  canvas: 'canvas',
  web: 'canvas',
}

const loadFontV3 = (stage, font) => {
  const type = fontTypeMapping[font.type] || 'sdf'

  if (type === 'sdf') {
    stage.loadFont('sdf', {
      fontFamily: font.family,
      atlasUrl: font.png || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.png`)),
      atlasDataUrl: font.json || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.json`)),
    })
  } else {
    stage.loadFont('canvas', {
      fontFamily: font.family,
      fontUrl: font.file,
    })
  }
}

const loadFontV2 = (stage, font, SdfTrFontFace, WebTrFontFace) => {
  if (font.type === 'sdf' || font.type === 'msdf') {
    if (!font.png && font.file) {
      font.png = font.file.replace(/\.[^.]+$/, `.${font.type}.png`)
    }
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
  } else if (font.type === 'web' || font.type === 'canvas') {
    stage.fontManager.addFontFace(
      new WebTrFontFace({
        fontFamily: font.family,
        fontUrl: font.file,
        descriptors: {},
        metrics: font.metrics,
      })
    )
  }
}

/**
 * Load fonts into the renderer stage.
 * Detects v2 vs v3 by checking if stage.loadFont exists (v3) or not (v2).
 *
 * @param {object} LightningRenderer - The namespace import from '@lightningjs/renderer'
 */
export default (LightningRenderer) => {
  const stage = renderer.stage
  const fonts = Settings.get('fonts', [])

  if (typeof stage.loadFont === 'function') {
    // v3 path
    for (let i = 0; i < fonts.length; i++) {
      loadFontV3(stage, fonts[i])
    }
  } else {
    // v2 path
    const { SdfTrFontFace, WebTrFontFace } = LightningRenderer
    for (let i = 0; i < fonts.length; i++) {
      loadFontV2(stage, fonts[i], SdfTrFontFace, WebTrFontFace)
    }
  }
}
