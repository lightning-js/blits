import threadx from '@lightningjs/threadx'
import application from '@lightningjs/renderer/application'
import createNode from '@lightningjs/renderer/node'

export default () => {
  let canvas = null
  let gl = null
  let app = null
  const nodes = new Map()

  threadx
    .register('renderer', [
      {
        name: 'events',
        array: 'int32',
        length: 2e4,
        allowMissing: true,
        mapping: ['boltId', 'property', 'value', 'event'],
      },
    ])
    .then(() => {})

  self.addEventListener('message', ({ data: { event, payload } }) => {
    if (event === 'canvas') {
      console.log('received canvas')
      canvas = payload.offscreenCanvas
      gl = createWebGLContext(canvas)
      app = application({
        w: 1400,
        h: 100,
        context: gl,
      })
      ready()
    }
  })

  const createWebGLContext = (canvas) => {
    const config = {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: true,
      desynchronized: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    }
    return canvas.getContext('webgl', config) || canvas.getContext('experimental-webgl', config)
  }

  const ready = () => {
    const mutationsQueue = {}

    threadx.listen('main.mutations', (data) => {
      data &&
        data.forEach((el) => {
          const node = nodes.get(el.elementId)
          if (node) {
            const keys = Object.keys(el)
            keys.forEach((key) => {
              if (el[key] !== 0) {
                node[key] = el[key]
              }
            })
          } else {
            mutationsQueue[el.elementId] = mutationsQueue[el.elementId] || []
            mutationsQueue[el.elementId].push(el)
          }
        })
    })

    const imagesQueue = {}

    threadx.listen('main.images', (el) => {
      const node = nodes.get(el.elementId)

      if (node) {
        loadImage(el.text).then((data) => {
          node.imageBitmap = data
        })
      } else {
        imagesQueue[el.elementId] = imagesQueue[el.elementId] || []
        imagesQueue[el.elementId].push(el)
      }
    })

    const loadImage = async (src) => {
      const response = await fetch(src)
      const blob = await response.blob()
      try {
        return await createImageBitmap(blob, {
          premultiplyAlpha: 'premultiply',
          colorSpaceConversion: 'none',
          imageOrientation: 'none',
        })
      } catch (e) {
        console.log('ERROR:', src, e)
      }
    }

    threadx.listen('main.bolt', (data) => {
      data &&
        data.forEach((el) => {
          const { elementId, parentId } = el
          const root = app.root
          const node = createNode(el)
          if (mutationsQueue[elementId]) {
            mutationsQueue[elementId].forEach((el) => {
              const keys = Object.keys(el)
              keys.forEach((key) => {
                if (el[key] !== 0 && key !== 'elementId') {
                  node[key] = el[key]
                }
              })
            })
            delete mutationsQueue[elementId]
          }

          if (imagesQueue[elementId]) {
            imagesQueue[elementId].forEach((el) => {
              loadImage(el.text)
                .then((data) => {
                  node.imageBitmap = data
                })
                .catch((e) => console.error('images queue error', elementId, e))
            })
            delete imagesQueue[elementId]
          }

          if (nodes.has(parentId)) {
            node.parent = nodes.get(parentId)
          } else {
            node.parent = root
          }
          // look up
          nodes.set(elementId, node)
        })
    })
  }
}
