import threadx from '@lightningjs/threadx'

let counter = 0

const element = {
  populate(data) {
    this.config.elementId = this.elementId
    threadx.send('bolt', { ...this.config, ...data })
  },
  set(property, value) {
    if (property === 'imageSource') {
      if (value !== -1) {
        threadx.send('images', {
          id: this.elementId,
          value,
        })
      }
    } else if (property === 'text') {
      threadx.send('text', {
        elementId: this.elementId,
        value,
      })
    } else {
      const mutation = {
        elementId: this.elementId,
      }
      mutation[property] = value
      threadx.send('mutations', mutation)
    }
  },
  delete() {
    // todo
  },
  id() {
    return this.elementId
  },
}

export default (config) => {
  return { ...element, ...{ elementId: ++counter, config } }
}
