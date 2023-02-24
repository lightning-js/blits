import threadx from '@lightningjs/threadx'
import { renderProperties } from '@lightningjs/renderer'
import sequence from './helpers/sequence.js'

const threads = [{ id: 'gl', src: './workers/renderer.js' }]

const buffers = [
  threadx.buffer({
    name: 'bolt',
    length: 2e6,
    mapping: renderProperties,
  }),
  threadx.buffer({
    name: 'mutations',
    length: 2e6,
    mapping: renderProperties,
  }),
  threadx.textbuffer({
    name: 'images',
    length: 1e5,
  }),
]

export default (App, target, settings) => {
  const canvas = document.createElement('canvas')
  canvas.width = settings.width || 1920
  canvas.height = settings.height || 1080

  if (target && target instanceof Element === false) {
    target = document.getElementById(target)
  }

  target && target.appendChild(canvas)

  const offscreenCanvas = canvas.transferControlToOffscreen()

  sequence([
    () => threadx.init(threads, buffers),
    () => {
      return new Promise((resolve) => {
        const worker = threadx.worker('gl')
        worker.addEventListener('message', ({ data }) => {
          if (data.event === 'ready') {
            resolve()
          }
        })

        worker.postMessage(
          {
            event: 'canvas',
            payload: {
              offscreenCanvas,
            },
          },
          [offscreenCanvas]
        )
      })
    },
    () => {
      App()
    },
  ])
}
