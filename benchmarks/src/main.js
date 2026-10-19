import Blits from '@lightningjs/blits'
import profiler from '@lightningjs/blits/profiler'
import Benchmark from './Benchmark.js'

const query = new URLSearchParams(window.location.search)
if (query.has('profile')) profiler.start({ frames: false })
Blits.Launch(Benchmark, 'app', {
  w: 1920,
  h: 1080,
  debugLevel: 0,
  fonts: [
    {
      family: 'opensans',
      type: 'msdf',
      file: 'fonts/OpenSans-Medium.ttf',
    },
  ],
  defaultFont: 'opensans',
})
