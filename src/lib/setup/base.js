import Focus from '../../focus.js'

export default (component) => {
  Object.defineProperties(component.prototype, {
    focus: {
      value: function () {
        Focus.set(this)
        this.lifecycle.state = 'focus'
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    unfocus: {
      value: function () {
        this.lifecycle.state = 'unfocus'
        Focus.set(this.parent)
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    destroy: {
      value: function () {
        console.log('destroy', this)
      },
    },
  })
}
