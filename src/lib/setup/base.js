import { renderer } from '../../launch.js'
import Focus from '../../focus.js'
import Image from '../../components/Image.js'
import Circle from '../../components/Circle.js'

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
    select: {
      value: function (id) {
        return this.el.filter((child) => child['id'] === id).pop()
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    shader: {
      value: function (type, args) {
        return renderer.makeShader('RoundedRectangle', args)
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    ___components: {
      value: {
        Image: Image(),
        Circle: Circle(),
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
  })
}
