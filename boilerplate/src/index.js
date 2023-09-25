import Blits from '@lightningjs/blits'

import App from './App.js'

const settings = {
  w: 1920,
  h: 1080,
  multithreaded: false,
  debugLevel: 1,
  fonts: [
    {family: 'lato', type: 'msdf', png: '/fonts/Lato-Regular.msdf.png', json: '/fonts/Lato-Regular.msdf.json'},
    {family: 'raleway', type: 'msdf', png: '/fonts/Raleway-ExtraBold.msdf.png', json: '/fonts/Raleway-ExtraBold.msdf.json'},
    {family: 'opensans', type: 'web', file: '/fonts/OpenSans-Medium.ttf'}
  ],
}

Blits.Launch(App, 'app', settings)
