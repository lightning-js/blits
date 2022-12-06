import threadx from '@lightningjs/threadx'
import { renderProperties } from '@lightningjs/renderer'
import sequence from './helpers/sequence.js'

export default (App, target, settings) => {
  // create canvas
  const canvas = document.createElement('canvas')
  canvas.width = settings.w
  canvas.height = settings.h

  if (target && target instanceof Element === false) {
    target = document.getElementById(target)
  }

  target && target.appendChild(canvas)

  sequence([registerThreadX, createBuffers, () => registerOffscreenCanvas(canvas)]).then(() => {
    setTimeout(() => {
      console.log('Initialize App')
      App()
    }, 300)
  })
}

// temporarily cause this should ideally be one call
const createBuffers = () => {
  return Promise.all([createImagesBuffer(), createOtherBuffers()])
}

const createImagesBuffer = async () => {
  return await threadx.textbuffer('main', [
    {
      name: 'images',
      array: 'int32',
      length: 1e4,
      useQueue: true,
      allowMissing: true,
      mapping: ['value'],
    },
  ])
}

const createOtherBuffers = async () => {
  return await threadx.register('main', [
    {
      name: 'bolt',
      array: 'int32',
      length: 2e6,
      allowMissing: true,
      useQueue: true,
      mapping: renderProperties,
    },
    {
      name: 'mutations',
      array: 'int32',
      length: 1e3,
      allowMissing: true,
      // useQueue: true,
      mapping: renderProperties,
    },
    // {
    //   name: 'images',
    //   array: 'int32',
    //   length: 1e4,
    //   text: true,
    //   mode: 'single',
    //   useQueue: true,
    //   allowMissing: true,
    //   mapping: ['value'],
    // },
    {
      name: 'text',
      array: 'int32',
      length: 1e4,
      mapping: [
        'fontStyle',
        'fontSize',
        'lineheight',
        'fontFamily',
        'letterSpacing',
        'maxLines',
        'wordwrapWidth',
        'value*',
      ],
    },
  ])
}

const registerThreadX = async () => {
  return await threadx.init([
    { id: 'gl', src: './workers/renderer.js' },
    // { id: 'animation', src: './workers/animation.js' },
    // { id: 'image', src: './workers/image.js' },
  ])
}

const registerOffscreenCanvas = async (canvas) => {
  const offscreenCanvas = canvas.transferControlToOffscreen()
  return await threadx.messageWorker(
    'gl',
    {
      event: 'canvas',
      payload: {
        offscreenCanvas,
      },
    },
    [offscreenCanvas]
  )
}
