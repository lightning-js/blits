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

import { createHumanReadableId, createInternalId } from './lib/componentId.js'
import { registerHooks, emit } from './lib/hooks.js'

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

import Settings from './settings.js'

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
      Log.debug(`Generating code for ${name} component`)
      code = codegenerator.call(config, parser(config.template))
    }

    setupBase(component)

    // setup hooks
    registerHooks(config.hooks, name)
    lifecycle.state = 'beforeSetup'

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
    lifecycle.state = 'setup'
  }

  const createLifecycle = (scope) => {
    const states = ['init', 'beforeSetup', 'setup', 'ready', 'focus', 'unfocus', 'destroy']

    return {
      previous: null,
      current: null,
      get state() {
        return this.current
      },
      set state(v) {
        if (states.indexOf(v) > -1 && v !== this.current) {
          Log.debug(
            `Setting lifecycle state from ${this.previous} to ${v} for ${scope.componentId}`
          )
          this.previous = this.current
          // emit 'private' hook
          emit(`___${v}`, name, scope)
          // emit 'public' hook
          emit(v, name, scope)
          this.current = v
        }
      },
    }
  }

  const component = function (opts, parentEl, parentComponent) {
    this.lifecycle = createLifecycle(this)

    if (!component.setup) {
      setupComponent(this.lifecycle)
    }

    this.parent = parentComponent
    this.wrapper = parentEl

    Object.defineProperties(this, {
      type: {
        value: name,
        writable: false,
        enumerable: true,
        configurable: false,
      },
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
        value: reactive(opts.props || {}, Settings.get('reactivityMode')),
        writable: false,
        enumerable: false,
        configurable: false,
      },
    })

    Object.defineProperty(this, '___state', {
      value: reactive(
        (config.state && typeof config.state === 'function' && config.state.apply(this)) || {},
        Settings.get('reactivityMode')
      ),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    this.lifecycle.state = 'init'

    Object.defineProperty(this, '___children', {
      value: code.render.apply(stage, [parentEl, this, code.context]),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    Object.defineProperty(this, '___slots', {
      value: this.___children.filter((child) => child.___isSlot),
      writable: false,
      enumerable: false,
      configurable: false,
    })

    code.effects.forEach((eff) => {
      effect(() => {
        eff.apply(stage, [this, this.___children, code.context])
      })
    })

    if (this.___watchers) {
      Object.keys(this.___watchers).forEach((watchKey) => {
        let old = this[watchKey]
        effect(() => {
          if (old !== this[watchKey]) {
            this.___watchers[watchKey].apply(this, [this[watchKey], old])
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
