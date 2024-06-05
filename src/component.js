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

import { Log } from './lib/log.js'
import parser from './lib/templateparser/parser.js'
import codegenerator from './lib/codegenerator/generator.js'
import { createHumanReadableId, createInternalId } from './lib/componentId.js'
import { emit } from './lib/hooks.js'
import { reactive } from './lib/reactivity/reactive.js'
import { effect } from './lib/reactivity/effect.js'
import Lifecycle from './lib/lifecycle.js'
import symbols from './lib/symbols.js'

import { stage, renderer } from './launch.js'

import Base from './component/base/index.js'

import Settings from './settings.js'

import setupComponent from './component/setup/index.js'
import components from './components/index.js'

// object to store global components
let globalComponents

const required = (name) => {
  throw new Error(`Parameter ${name} is required`)
}

/**
 * Component factory function
 * @param {string} name - The name of the component
 * @param {object} config - The configuration object for the component
 * @returns {function} - A factory function that creates a new component instance
 *
 */
const Component = (name = required('name'), config = required('config')) => {
  let base

  const component = function (opts, parentEl, parentComponent, rootComponent) {
    // generate a human readable ID for the component instance (i.e. Blits::ComponentName1)
    this.componentId = createHumanReadableId(name)

    // instantiate a lifecycle object for this instance
    this.lifecycle = Object.assign(Object.create(Lifecycle), {
      component: this,
      previous: null,
      current: null,
    })

    // set a reference to the parent component
    this.parent = parentComponent

    //
    this.rootParent = rootComponent

    // set a reference to the holder / parentElement
    // Components are wrapped in a holder node (used to apply positioning and transforms
    // such as rotation and scale to components)
    this[symbols.holder] = parentEl

    // generate an internal id (simple counter)
    this[symbols.id] = createInternalId()

    // set the internal props and make them reactive (based on the reactivity mode)
    this[symbols.props] = reactive(opts.props || {}, Settings.get('reactivityMode'))

    // create an empty array for storing timeouts created by this component (via this.$setTimeout)
    this[symbols.timeouts] = []

    // create an empty array for storing intervals created by this component (via this.$setInterval)
    this[symbols.intervals] = []

    // apply the state function (passing in the this reference to utilize configured props)
    // and store a reference to this original state
    // hasFocus key is sprinkled in
    this[symbols.originalState] = {
      ...((config.state && typeof config.state === 'function' && config.state.apply(this)) || {}),
      ...{ hasFocus: false },
    }

    // generate a reactive state (using the result of previously execute state function)
    // and store it
    this[symbols.state] = reactive(this[symbols.originalState], Settings.get('reactivityMode'))

    // all basic setup has been done now, set the lifecycle to state 'init'
    this.lifecycle.state = 'init'

    // execute the render code that constructs the initial state of the component
    // and store the children result (a flat map of elements and components)
    this[symbols.children] =
      config.code.render.apply(stage, [parentEl, this, config, globalComponents, effect]) || []

    // create a reference to the wrapper element of the component (i.e. the root Element of the component)
    this[symbols.wrapper] = this[symbols.children][0]

    // create a reference to an array of children that are slots
    this[symbols.slots] = this[symbols.children].filter((child) => child[symbols.isSlot])

    // register hooks if component has hooks specified
    if (config.hooks) {
      // frame tick event
      if (config.hooks.frameTick) {
        renderer.on('frameTick', (r, data) =>
          emit('frameTick', this[symbols.identifier], this, [data])
        )
      }

      if (config.hooks.idle) {
        renderer.on('idle', () => {
          emit('idle', this[symbols.identifier], this)
        })
      }

      // inBounds event emiting a lifecycle attach event
      if (config.hooks.attach) {
        this[symbols.wrapper].node.on('inBounds', () => {
          this.lifecycle.state = 'attach'
        })
      }

      // outOfBounds event emiting a lifeycle detach event
      if (config.hooks.detach) {
        this[symbols.wrapper].node.on('outOfBounds', (node, { previous }) => {
          if (previous > 0) this.lifecycle.state = 'detach'
        })
      }

      // inViewport event emiting a lifecycle enter event
      if (config.hooks.enter) {
        this[symbols.wrapper].node.on('inViewport', () => {
          this.lifecycle.state = 'enter'
        })
      }

      // outOfViewport event emitting a lifecycle exit event
      if (config.hooks.exit) {
        this[symbols.wrapper].node.on('outOfViewport', () => {
          this.lifecycle.state = 'exit'
        })
      }
    }

    // setup (and execute) all the generated side effects based on the
    // reactive bindings define in the template
    for (let i = 0; i < config.code.effects.length; i++) {
      effect(() => {
        config.code.effects[i].apply(stage, [
          this,
          this[symbols.children],
          config,
          globalComponents,
          rootComponent,
          effect,
        ])
      })
    }

    // setup watchers if the components has watchers specified
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

    // set all symbol based properties to non-enumerable and non-configurable
    Object.getOwnPropertySymbols(this).forEach((property) => {
      Object.defineProperties(this, {
        [property]: {
          enumerable: false,
          configurable: false,
        },
      })
    })

    // finaly set the lifecycle state to ready (in the next tick)
    setTimeout(() => (this.lifecycle.state = 'ready'))

    // and return this
    return this
  }

  const factory = (options = {}, parentEl, parentComponent, rootComponent) => {
    // setup the component once, using Base as the prototype
    if (!base) {
      Log.debug(`Setting up ${name} component`)
      base = setupComponent(Object.create(Base), config)
    }

    // one time code generation (only if precompilation is turned off)
    if (!config.code) {
      Log.debug(`Generating code for ${name} component`)
      config.code = codegenerator.call(config, parser(config.template, name))
    }

    // register global components once
    if (!globalComponents) {
      globalComponents = components()
    }

    // create an instance of the component, using base as the prototype (which contains Base)
    return component.call(Object.create(base), options, parentEl, parentComponent, rootComponent)
  }

  // store the config on the factory, in order to access the config
  // during the code generation step
  factory.config = config

  return factory
}

export default Component
