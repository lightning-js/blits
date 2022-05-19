import parser from '../node_modules/@lightningjs/template-parser/index.js'
import renderGenerator from '../node_modules/@lightningjs/render-code-generator/index.js'
import { emit, registerHooks } from './lib/hooks.js'
import { app } from './lib/app.js'
import { reactive, effect } from '../node_modules/@vue/reactivity/dist/reactivity.esm-browser.js'
import { createNode } from '../node_modules/@lightningjs/renderer/index.js'
import { normalizeARGB } from '../node_modules/@lightningjs/renderer/lib/utils.js'

const stage = {
  createElement: createNode,
  normalizeARGB,
}

const Component = (name, config) => {

  let render
  let context
  let counter = 1

  const component = function (opts) {
    this.id = 'component' + '_' + this.name + '_' + counter++

    const props = config.props
      ? config.props
          .filter((prop) => prop in opts.props)
          .reduce((acc, prop) => {
            acc[prop] = opts.props[prop]
            return acc
          }, {})
      : {}

    this.state = reactive({ ...(config.state && config.state.apply(props)), ...props })

    registerHooks(opts.hooks, this.id)
    emit('init', this.id, this)

    if (!render) {
      const generatedCode = renderGenerator.call(config, parser(config.template))
      render = generatedCode.render
      context = generatedCode.context
    }

    let el

    effect(() => {
      el = render.apply(stage, [app.root || parent, this, el, context])
    })
  }

  component.prototype.name = name

  component.prototype = Object.keys(config.methods || {}).reduce((prototype, method) => {
    prototype[method] = config.methods[method]
    return prototype
  }, component.prototype)

  config.props &&
    config.props.forEach((key) => {
      Object.defineProperty(component.prototype, key, {
        get() {
          return this.state[key]
        },
      })
    })

  config.state &&
    typeof config.state === 'function' &&
    Object.keys(config.state()).forEach((key) => {
      Object.defineProperty(component.prototype, key, {
        get() {
          return this.state[key]
        },
        set(v) {
          this.state[key] = v
        },
      })
    })

  return (options = {}) => {
    const opts = { ...config, ...options }
    return new component(opts)
  }
}

export default Component
