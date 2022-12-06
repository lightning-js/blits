import threadx from '@lightningjs/threadx'

let counter = 0

export default (config) => {
  const elementId = ++counter
  return {
    populate(data) {
      config.elementId = elementId
      threadx.send('main.bolt', { ...config, ...data })
    },
    set(property, value) {
      if (property === 'imageSource') {
        if (value !== -1) {
          threadx.send('main.images', {
            boltId: elementId,
            value,
          })
        }
      } else if (property === 'text') {
        threadx.send('main.text', {
          elementId,
          value,
        })
      } else {
        const mutation = {
          elementId,
        }
        mutation[property] = value
        threadx.send('main.mutations', mutation)
      }
    },
    delete() {
      // todo
    },
    id() {
      return elementId
    },
  }
}
