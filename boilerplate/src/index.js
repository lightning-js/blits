import Blits from '@lightningjs/blits'

import App from './App.js'

const settings = {
  w: 1920,
  h: 1080,
  multithreaded: false,
}

Blits.Launch(App, 'app', settings)
