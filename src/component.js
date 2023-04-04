import parser from '@lightningjs/bolt-template-parser/index.js'
import renderGenerator from '@lightningjs/bolt-code-generator/index.js'

import element from './element.js'

import { createHumanReadableId, createInternalId } from './lib/componentId.js'
import { registerHooks, emit } from './lib/hooks.js'

import { reactive } from './lib/reactivity/reactive.js'
import setupProps from './lib/setup/props.js'
import setupMethods from './lib/setup/methods.js'
import setupState from './lib/setup/state.js'
import setupComputed from './lib/setup/computed.js'
import { effect } from './lib/reactivity/effect.js'
// import setupWatch from './lib/setup/watch.js'

const stage = {
  element,
}

const required = (name) => {
  throw new Error(`Parameter ${name} is required`)
}

const Component = (name = required('name'), config = required('config')) => {
  let code = null

  const setupComponent = (lifecycle) => {
    // code generation
    if (!code) {
      code = renderGenerator.call(config, parser(config.template))
    }

    // setup hooks
    registerHooks(config.hooks, name)
    lifecycle.state = 'beforeSetup'

    // setup props
    if (config.props) setupProps(component, config.props)

    // setup methods
    if (config.methods) setupMethods(component, config.methods)

    // setup state
    if (config.state) setupState(component, config.state)

    // setup computed
    if (config.computed) setupComputed(component, config.computed)

    // setup watchers
    // if (config.watch) setupWatch(component, config.watch)

    component.setup = true
    lifecycle.state = 'setup'
  }

  const createLifecycle = (scope) => {
    const states = ['init', 'beforeSetup', 'setup']

    return {
      previous: null,
      current: null,
      get state() {
        return this.current
      },
      set state(v) {
        if (states.indexOf(v) > -1 && v !== this.current) {
          this.previous = this.current
          emit(v, name, scope)
          this.current = v
        }
      },
    }
  }

  const component = function (opts, parent) {
    const lifecycle = createLifecycle(this)

    if (!component.setup) {
      setupComponent(lifecycle)
    }

    Object.defineProperties(this, {
      componentId: {
        value: createHumanReadableId(name),
        writable: false,
        enumerable: true,
        configurable: false,
      },
      ___id: {
        value: createInternalId(),
        writable: false,
        enumerable: false,
        configurable: false,
      },
      ___props: {
        value: reactive(opts.props || {}),
        writable: false,
        enumerable: false,
        configurable: false,
      },
    })

    Object.defineProperty(this, '___state', {
      value: reactive(
        (config.state && typeof config.state === 'function' && config.state.apply(this)) || {}
      ),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    lifecycle.state = 'init'

    this.el = code.render.apply(stage, [parent, this, code.context])
    lifecycle.state = 'render'

    code.effects.forEach((eff) => {
      effect(() => {
        eff.apply(stage, [this, this.el, code.context])
      })
    })
  }
  return (options = {}, parent) => {
    // const opts = { ...config, ...options } // not sure if this should be even possible?
    return new component(options, parent)
  }
}

export default Component
