import { renderer } from '../../launch.js'
import Focus from '../../focus.js'
import { to } from '../../router.js'
import Image from '../../components/Image.js'
import Circle from '../../components/Circle.js'
import RouterView from '../../components/RouterView'

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
        this.lifecycle.state = 'destroy'
        for (let i = 0; i < this.___timeouts.length; i++) {
          clearTimeout(this.___timeouts[i])
        }
        for (let i = 0; i < this.___intervals.length; i++) {
          clearInterval(this.___intervals[i])
        }
      },
      writable: false,
      enumerable: true,
      configurable: false,
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
    $router: {
      value: {
        to,
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ___components: {
      value: {
        Image: Image(),
        Circle: Circle(),
        RouterView: RouterView(),
      },
      writable: false,
      enumerable: false,
      configurable: false,
    },
    ___timeouts: {
      value: [],
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $setTimeout: {
      value: function (fn, ms, ...params) {
        const timeoutId = setTimeout(
          () => {
            this.____timeouts = this.___timeouts.filter((id) => id !== timeoutId)
            fn.apply(null, params)
          },
          ms,
          params
        )
        this.___timeouts.push(timeoutId)
        return timeoutId
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ___intervals: {
      value: [],
      writable: false,
      enumerable: false,
      configurable: false,
    },
    $setInterval: {
      value: function (fn, ms, ...params) {
        const intervalId = setInterval(
          () => {
            this.____intervals = this.___intervals.filter((id) => id !== intervalId)
            fn.apply(null, params)
          },
          ms,
          params
        )
        this.___intervals.push(intervalId)
        return intervalId
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
  })
}