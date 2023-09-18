import Bolt from '@lightningjs/bolt'

import App from './App.js'

const settings = {
  w: 1920,
  h: 1080,
  multithreaded: false,
}

Bolt.Launch(App, 'app', settings)
