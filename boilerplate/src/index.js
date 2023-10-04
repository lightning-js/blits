import Blits from '@lightningjs/blits'
// @ts-ignore
import fontLoader from './fontloader.js?importChunkUrl'

import App from './App.js'

Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  multithreaded: false,
  debugLevel: 1,
  fontLoader: fontLoader,
  fonts: [
    {family: 'lato', type: 'msdf', png: '/fonts/Lato-Regular.msdf.png', json: '/fonts/Lato-Regular.msdf.json'},
    {family: 'raleway', type: 'msdf', png: '/fonts/Raleway-ExtraBold.msdf.png', json: '/fonts/Raleway-ExtraBold.msdf.json'},
    {family: 'opensans', type: 'web', file: '/fonts/OpenSans-Medium.ttf'}
  ],
})
