import threadx from '@lightningjs/threadx'

let counter = 0

export default (config) => {
  const elementId = ++counter
  return {
    populate(data) {
      config.elementId = elementId
      threadx.send('bolt', { ...config, ...data })
    },
    set(property, value) {
      if (property === 'imageSource') {
        if (value !== -1) {
          threadx.send('images', {
            id: elementId,
            value,
          })
        }
      } else if (property === 'text') {
        threadx.send('text', {
          elementId,
          value,
        })
      } else {
        const mutation = {
          elementId,
        }
        mutation[property] = value
        threadx.send('mutations', mutation)
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
