import queryParam from '../helpers/queryparam.js'

const defaultKeyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Enter: 'enter',
  ' ': 'space',
  Backspace: 'back',
  Escape: 'escape',
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  13: 'enter',
  32: 'space',
  8: 'back',
  27: 'escape',
  178: 'stop',
  250: 'playPause',
}

const keymapping = {
  sky: {
    test() {
      return navigator.userAgent.indexOf('WPE Sky') > -1 || queryParam('keymapping') === 'sky'
    },
    mapping: {
      Escape: 'back',
      27: 'back',
      227: 'rewind',
      179: 'playPause',
      228: 'fastForward',
    },
  },
  webos: {
    test() {
      return navigator.userAgent.indexOf('WebOS') > -1 || queryParam('keymapping') === 'webos'
    },
    mapping: {
      19: 'pause',
      412: 'rewind',
      413: 'stop',
      415: 'play',
      417: 'fastForward',
      461: 'back',
    },
  },
  tizen: {
    test() {
      return navigator.userAgent.indexOf('Tizen') > -1 || queryParam('keymapping') === 'tizen'
    },
    mapping: {
      10009: 'back',
      10252: 'playPause',
      19: 'pause',
      412: 'rewind',
      413: 'stop',
      415: 'play',
      417: 'fastForward',
    },
  },
}

export default () => {
  let mapping = {}

  Object.keys(keymapping).forEach((target) => {
    if (keymapping[target].test() === true) {
      mapping = keymapping[target].mapping
      return
    }
  })

  return { ...defaultKeyMap, ...mapping }
}
