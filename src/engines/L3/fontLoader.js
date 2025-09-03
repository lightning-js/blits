import Settings from '../../settings.js'
import { renderer } from './launch.js'

const fontTypeMapping = {
  sdf: 'sdf',
  msdf: 'sdf',
  canvas: 'canvas',
  web: 'canvas',
}

export default () => {
  const stage = renderer.stage

  const fonts = Settings.get('fonts', [])
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i]
    const type = fontTypeMapping[font.type] || 'sdf'

    if (type === 'sdf') {
      stage.loadFont('sdf', {
        fontFamily: font.family,
        atlasUrl: font.json || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.png`)),
        atlasDataUrl:
          font.json || (font.file && font.file.replace(/\.[^.]+$/, `.${font.type}.json`)),
      })
    } else {
      stage.loadFont('canvas', {
        fontFamily: font.family,
        fontUrl: font.file,
      })
    }
  }
}
