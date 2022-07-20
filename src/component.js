import parser from '@lightningjs/bolt-template-parser/index.js'
import renderGenerator from '@lightningjs/bolt-code-generator/index.js'
import { emit, registerHooks } from './lib/hooks.js'
import { app } from './lib/app.js'
import { reactive, effect } from '@vue/reactivity/dist/reactivity.esm-browser.js'
import { createNode } from '@lightningjs/lightning-renderer/index.js'
import { normalizeARGB } from '@lightningjs/lightning-renderer/lib/utils.js'

const stage = {
  createElement: createNode,
  normalizeARGB,
}

const Component = (name, config) => {

  let render
  let update
  let context
  let counter = 1

  const component = function (opts) {

    this._id = 'component' + '_' + this.name + '_' + counter++

    this.state = reactive({...config.state && typeof config.state === 'function' && config.state(), ...opts.props})

    registerHooks(opts.hooks, this._id)
    emit('init', this._id, this)

    if (!render && !update) {
      const generatedCode = renderGenerator.call(config, parser(config.template))
      render = generatedCode.render
      update = generatedCode.update
      context = generatedCode.context
    }

    this.el = render.apply(stage, [app.root || parent, this, context])

    effect(() => {
      update.apply(stage, [this, this.el, context])
    })
  }

  component.prototype.name = name

  component.prototype.destroy = function() {
    emit('destroy', this._id, this)
    this.el[1].destroy()
    setTimeout(() => delete this.el[1])
  }

  component.prototype = Object.keys(config.methods || {}).reduce((prototype, method) => {
    prototype[method] = config.methods[method]
    return prototype
  }, component.prototype)

  config.props &&
    config.props.forEach((key) => {
      Object.defineProperty(component.prototype, key, {
        get() {
          return this.props[key]
        },
        set(v) {
          this.props[key] = v
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

    Object.defineProperty(component.prototype, 'props', {
      set(v = {}) {
        Object.keys(v).forEach(prop => {
          this[prop] = v[prop]
        })
      }
    })

  return (options = {}) => {
    const opts = { ...config, ...options }
    return new component(opts)
  }
}

export default Component
