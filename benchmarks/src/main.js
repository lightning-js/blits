import Blits from '@lightningjs/blits'
import profiler from '@lightningjs/blits/profiler'
import createBenchmark from './App.js'
import { benchmarks, defaultBenchmark, validateBenchmark } from '../benchmarks.js'

const query = new URLSearchParams(window.location.search)
const name = validateBenchmark(query.get('benchmark') ?? defaultBenchmark)
const { default: benchmark, title } = await benchmarks[name]()

if (query.has('profile')) profiler.start({ frames: false })

Blits.Launch(createBenchmark(benchmark, title), 'app', {
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
