/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import parser from './lib/templateparser/parser.js'
import codegenerator from './lib/codegenerator/generator.js'

import element from './element.js'
import { renderer } from './launch.js'

import { createHumanReadableId, createInternalId } from './lib/componentId.js'
import { registerHooks } from './lib/hooks.js'

import { reactive } from './lib/reactivity/reactive.js'
import setupBase from './lib/setup/base.js'
import setupProps from './lib/setup/props.js'
import setupMethods from './lib/setup/methods.js'
import setupState from './lib/setup/state.js'
import setupComputed from './lib/setup/computed.js'
import setupInput from './lib/setup/input.js'
import setupRoutes from './lib/setup/routes.js'
import setupWatch from './lib/setup/watch.js'
import { effect } from './lib/reactivity/effect.js'
import { Log } from './lib/log.js'
import lifecycle from './lib/lifecycle.js'

import Settings from './settings.js'
import symbols from './lib/symbols.js'

const stage = {
  element,
}

const required = (name) => {
  throw new Error(`Parameter ${name} is required`)
}

const Component = (name = required('name'), config = required('config')) => {
  const setupComponent = (parentComponent) => {
    // code generation
    if (!config.code) {
      Log.debug(`Generating code for ${name} component`)
      config.code = codegenerator.call(config, parser(config.template, name, parentComponent))
    }

    setupBase(component, name)

    // setup hooks
    registerHooks(config.hooks, name)

    // setup props
    // if (config.props) // because of the default props like id - might change this
    setupProps(component, config.props)

    // setup methods
    if (config.methods) setupMethods(component, config.methods)

    // setup state
    if (config.state) setupState(component, config.state)

    // setup computed
    if (config.computed) setupComputed(component, config.computed)

    // setup watchers
    if (config.watch) setupWatch(component, config.watch)

    // setup routes
    if (config.routes) setupRoutes(component, config.routes)

    // setup input
    if (config.input) setupInput(component, config.input)

    component.setup = true
  }

  const component = function (opts, parentEl, parentComponent) {
    this.lifecycle = Object.assign(Object.create(lifecycle), {
      component: this,
      previous: null,
      current: null,
    })

    if (!component.setup) {
      setupComponent(parentComponent)
    }
    if (config.hooks && config.hooks.frameTick) {
      renderer.on('frameTick', (r, data) => emit('frameTick', name, this, [data]))
    }

    this.parent = parentComponent
    this[symbols.wrapper] = parentEl

    Object.defineProperties(this, {
      componentId: {
        value: createHumanReadableId(name),
        writable: false,
        enumerable: true,
        configurable: false,
      },
      [symbols.id]: {
        value: createInternalId(),
        writable: false,
        enumerable: false,
        configurable: false,
      },
      [symbols.props]: {
        value: reactive(opts.props || {}, Settings.get('reactivityMode')),
        writable: false,
        enumerable: false,
        configurable: false,
      },
      [symbols.timeouts]: {
        value: [],
        writable: true,
        enumerable: false,
        configurable: false,
      },
      [symbols.intervals]: {
        value: [],
        writable: true,
        enumerable: false,
        configurable: false,
      },
    })

    Object.defineProperty(this, symbols.originalState, {
      value: (config.state && typeof config.state === 'function' && config.state.apply(this)) || {},
      writable: false,
      enumerable: false,
      configurable: false,
    })

    Object.defineProperty(this, symbols.state, {
      value: reactive(this[symbols.originalState], Settings.get('reactivityMode')),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    this.lifecycle.state = 'init'

    Object.defineProperty(this, symbols.children, {
      value: config.code.render.apply(stage, [parentEl, this, config]),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    Object.defineProperty(this, symbols.slots, {
      value: this[symbols.children].filter((child) => child[symbols.isSlot]),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    config.code.effects.forEach((eff) => {
      effect(() => {
        eff.apply(stage, [this, this[symbols.children], config])
      })
    })

    if (this[symbols.watchers]) {
      Object.keys(this[symbols.watchers]).forEach((watchKey) => {
        let old = this[watchKey]
        effect((force = false) => {
          if (old !== this[watchKey] || force === true) {
            this[symbols.watchers][watchKey].apply(this, [this[watchKey], old])
            old = this[watchKey]
          }
        })
      })
    }

    // next tick
    setTimeout(() => (this.lifecycle.state = 'ready'))
  }

  const factory = (options = {}, parentEl, parentComponent) => {
    return new component(options, parentEl, parentComponent)
  }

  factory.config = config

  return factory
}

export default Component
