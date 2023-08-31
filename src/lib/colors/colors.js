import htmlColors from './htmlColors.js'
import { Log } from '../log.js'

export default {
  normalize(color = '') {
    color = color.toString()

    if (color.startsWith('0x')) {
      return rgbaToAbgr(color)
    }

    const rgbaRegex = /rgba?\((.+)\)/gi
    const hslaRegex = /hsla?\((.+)\)/gi

    // RGB(A) color format
    if (rgbaRegex.test(color)) {
      const match = new RegExp(rgbaRegex).exec(color)
      if (match[1]) {
        color = match[1]
          .split(',')
          .map((c, i) => {
            if (i == 3) {
              c = Math.min(Math.max(Math.round(c * 255), 0), 255)
            }
            return parseInt(c).toString(16).padStart(2, '0')
          })
          .join('')
        return rgbaToAbgr(color)
      }
    }
    // HSL(A) color format
    else if (hslaRegex.test(color)) {
      Log.error('HSL(A) color format is not supported yet')
    }
    // HTMl name color format
    else if (color in htmlColors) {
      return htmlColors[color]
    }
    // hex rgba format
    else if (color.startsWith('#')) {
      color = color.substring(1)
    }
    if (color.length === 3) {
      color = color
        .split('')
        .map((c) => c + c)
        .join('')
    }

    return rgbaToAbgr(color)
  },
}

const rgbaToAbgr = (rgba) => {
  const [prefix, r, g, b, a] = rgba.padEnd(8, 'f').padStart(10, '0x').match(/.{2}/g)
  return prefix + a + r + g + b
  // return prefix + a + b + g + r
}
