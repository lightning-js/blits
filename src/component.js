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
import { reactive, getRaw } from './lib/reactivity/reactive.js'
import { effect } from './lib/reactivity/effect.js'
import Lifecycle from './lib/lifecycle.js'
import symbols from './lib/symbols.js'

import { stage, renderer } from './launch.js'

import { default as Base, shared } from './component/base/index.js'

import Settings from './settings.js'

import setupComponent from './component/setup/index.js'
import components from './components/index.js'

import { plugins } from './plugin.js'

// object to store global components
let globalComponents

const required = (name) => {
  throw new Error(`Parameter ${name} is required`)
}

/**
 * @typedef {function} BlitsComponentFactory
 * @param {object} opts - The options for the component instance
 * @param {BlitsComponent} parentEl - The parent element for the component instance
 * @param {BlitsComponent} parentComponent - The parent component for the component instance
 * @param {BlitsComponent} rootComponent - The root component for the component instance
 * @returns {BlitsComponent} - The component instance
 */

/**
 *  Structure of a Blits component:
 *  Component:
 *   <Holder>
 *      <Wrapper>
 *           []<Elements>
 *      </Wrapper>
 *   </Holder>
 *
 * A Blits Element
 * @typedef {Object} BlitsAnnouncer
 * @property {(message: string) => void} assertive - Function to assertively announce a message.
 * @property {() => void} clear - Function to clear the announcer.
 * @property {() => void} disable - Function to disable the announcer.
 * @property {() => void} enable - Function to enable the announcer.
 * @property {(delay: number) => void} pause - Function to pause the announcer.
 * @property {(message: string) => void} polite - Function to politely announce a message.
 * @property {(message: string, politeness: 'off'|'polite'|'assertive') => void} announce - Function to announce a message with specified politeness.
 * @property {() => void} stop - Function to stop the announcer.
 * @property {(v: boolean) => void} toggle - Function to toggle the announcer.
 *
 * @typedef {Object} BlitsElementConfig
 * @property {BlitsElement} parent - The parent element of this element.
 * @property {any} node - The node object for the element.
 *
 * @typedef {Object} BlitsElementProps
 * @property {boolean} __textnode - Indicates if the element is a text node.
 * @property {boolean} __layout - Indicates if the element is a layout node.
 * @property {BlitsElement} element - The element to which the props belong?? Do we need this?
 * @property {BlitsElementConfig} config - Configuration object for the element.
 * @property {Object<string, any>} props - The props object containing the properties of the element.
 * @property {Object<string, any>} raw - The raw input props.
 * @property {Object<string, any>} scheduledTransitions - Tracks transitions by property name.
 *
 * @typedef {Object} BlitsElement
 * @property {BlitsComponent} component - Reference to the owning Blits component.
 * @property {BlitsElementConfig} config - Configuration object for the element.
 * @property {number} counter - Unique counter used for shader workarounds. FIXME?
 * @property {string[]} effectNames - Names of active shader effects.
 * @property {any} node - The underlying renderer node (e.g., WebGL node or text node).
 * @property {BlitsElementProps} props - Proxy-like object containing transformed props.
 * @property {any[]} children - WVB I cant see this populated? Filtered list of children owned by this element. FIXME?
 * @property {any} parent - WVB Shortcut to the parent CoreNode?
 * @property {number} nodeId - ID of the CoreNode, if available.
 * @property {string|null} ref - Ref name (if defined).
 * @property {function(Object):void} populate - Initializes the element with props and hooks.
 * @property {function(string, any):void} set - Updates a single property.
 * @property {function(string, any, Object):void} animate - Animates a property with transition options.
 * @property {function():void} destroy - Destroys the underlying node and cancels transitions.
 * @property {function(any): any} triggerLayout - Triggers a layout update for the element.
 *
 * @typedef {Object} BlitsLifecycle
 * @property {BlitsComponent} component - The Blits comonent instance this lifecycle belongs to.
 * @property {'init'|'ready'|'destroyed'} current - The current lifecycle state of the component.
 * @property {'init'|'ready'|'destroyed'|null} previous - The previous lifecycle state of the component.
 * @property {string} state - The current lifecycle state of the component.
 *
 * @typedef {object} BlitsComponent
 * Main properties of the Blits component:
 * @property {boolean?} eol - Indicates when a component is End of Life
 * @property {string} componentId - The unique identifier for the component instance
 * @property {BlitsLifecycle} lifecycle - The lifecycle object for the component instance
 * @property {BlitsComponent} parent - The parent component of the current component instance
 * @property {BlitsComponent} rootParent - Reference to the root component in case of slots, otherwise this is the same as parent
 * @property {BlitsComponent|BlitsElement[]} [children] - The children of the component instance
 * @property {BlitsElement} [holder] - The wrapper of the entire component instance
 * @property {number} [id] - The internal ID for the component instance
 * @property {number} [identifier] - The identifier for the component instance WVB Whats the difference with id?
 * @property {any[]} [intervals] - The intervals created by the component instance WVB Fixme
 * @property {Object<string, any>} [originalState] - The original state of the component instance
 * @property {Object<string, any>} [props] - The reactive properties of the component instance
 * @property {any[]} [slots] - The slots of the component instance WVB Fixme
 * @property {Object<string, any>} [state] - The reactive state of the component instance
 * @property {any[]} [timeouts] - The timeouts created by the component instance
 * @property {BlitsElement} [wrapper] - The reference to the outer element of the component instance
 * @property {object} [effects] - The effects of the component instance
 * @property {object} [watchers] - The watchers of the component instance
 * @property {Object<string, any>} computedKeys - The computed keys of the component instance
 * @property {any[]} [effects] - The effects of the component instance
 * @property {string[]} [propKeys] - The keys of the props of the component instance
 * @property {any[]} [stateKeys] - The keys of the state of the component instance
 * Single props:
 * @property {object} activeView - The active view of the component instance
 * @property {boolean} hasFocus - Indicates if the component has focus
 * @property {string} ref - The reference name of the component instance
 * @property {number|undefined} index - The index in a for loop
 * @property {number|undefined} activeRow - The active row in a for loop
 * @property {string} color - The color of the component instance
 * @property {number} radius - The radius of the component instance
 * @property {number} size - The size of the component instance
 * Methods:
 * @property {function(): void} destroy - Destroys the component and its children, clearing listeners and effects.
 * @property {function(any): any} focus - ⚠️ Deprecated. Use `$focus()` instead.
 * @property {function(string): any} select - ⚠️ Deprecated. Use `$select(ref)` instead.
 * @property {function(string, object): {type: string, props: object}} shader - Creates a shader definition object.
 * @property {function(string): void} trigger - ⚠️ Deprecated. Use `$trigger(key)` instead.
 * @property {function(): void} unfocus - Clears the focus state and sets lifecycle to 'unfocus'.
 * Builtins:
 * @property {BlitsAnnouncer} $announcer - The announcer object for the component instance
 * @property {() => void} $clearTimeouts - Clears all timeouts created by the component instance
 * @property {(timeoutId: number) => void} $clearTimeout - Clears all timeouts created by the component instance
 * @property {() => void} $clearIntervals - Clears all intervals created by the component instance
 * @property {(intervalId: number) => void} $clearInterval - Clears all intervals created by the component instance
 * @property {Object} $colors - The colors object for the component instance
 * @property {(event: string, params: object) => void} $emit - Emits an event with the specified parameters
 * @property {function(any): void} $focus - Sets the component focus state and delegates to the Focus manager.
 * @property {Object} $language - The language object for the component instance
 * @property {function(any): any} $listen - The listen object for the component instance
 * @property {Object} $log - The log object for the component instance
 * @property {Object} $router - The router object for the component instance
 * @property {function(string): any} $select - Selects a child component by `ref`.
 * @property {function(any): any} $setInterval - Sets an interval for the component instance
 * @property {function(any): any} $setTimeout - Sets a timeout for the component instance
 * @property {function(any): any} $size - The size object for the component instance
 * @property {function(any): any} $sizes - The sizes object for the component instance
 * @property {function(string): void} $trigger - Forces a reactivity trigger on a property in `originalState`.
 * @property {function(any): any} $unlisten - The unlisten object for the component instance
 *
 */

/**
 * @typedef {Object} BlitsComponentConfig
 * @property {string} template - The template string for the component.
 * @property {function(this: BlitsComponent): Object} [state] - State factory function.
 * @property {Object} [hooks] - Lifecycle hooks (frameTick, idle, attach, detach, enter, exit, etc).
 * @property {Object} [code] - Compiled render/effects code (render: Function, effects: Function[]).
 * @property {string} [name] - Optional name for the component.
 * @property {any} [data] - Optional static data for the component.
 * @property {Object} [options] - Optional options for the component.
 */

/**
 * Component factory function
 * @param {string} name - The name of the component
 * @param {BlitsComponentConfig} config - The configuration object for the component
 * @returns {BlitsComponentFactory} - The component factory function
 */
const Component = (name = required('name'), config = required('config')) => {
  let base = undefined

  const component = function (opts, parentEl, parentComponent, rootComponent) {
    // generate a human readable ID for the component instance (i.e. Blits::ComponentName1)
    this.componentId = createHumanReadableId(name)

    this[symbols.effects] = []

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

    // create a Map for storing debounced functions (via this.$debounce)
    this[symbols.debounces] = new Map()

    // apply the state function (passing in the this reference to utilize configured props)
    // and store a reference to this original state
    this[symbols.originalState] =
      (config.state && typeof config.state === 'function' && config.state.apply(this)) || {}
    // add hasFocus key in
    this[symbols.originalState]['hasFocus'] = false

    // generate a reactive state (using the result of previously execute state function)
    // and store it
    this[symbols.state] = reactive(this[symbols.originalState], Settings.get('reactivityMode'))

    // all basic setup has been done now, set the lifecycle to state 'init'
    this.lifecycle.state = 'init'

    // execute the render code that constructs the initial state of the component
    // and store the children result (a flat map of elements and components)
    const { elms, cleanup } = config.code.render.apply(stage, [
      parentEl,
      this,
      config,
      globalComponents,
      effect,
      getRaw,
      Log,
    ]) || { elms: [], cleanup: () => {} }

    this[symbols.children] = elms
    this[symbols.cleanup] = cleanup

    // create a reference to the wrapper element of the component (i.e. the root Element of the component)
    this[symbols.wrapper] = this[symbols.children][0]

    // create a reference to an array of children that are slots
    this[symbols.slots] = this[symbols.children].filter((child) => child[symbols.isSlot])

    this[symbols.rendererEventListeners] = []
    // register hooks if component has hooks specified
    if (config.hooks) {
      // push to next tick to ensure
      setTimeout(() => {
        // frame tick event
        if (config.hooks.frameTick) {
          const cb = (r, data) => emit('frameTick', this[symbols.identifier], this, [data])
          this[symbols.rendererEventListeners].push({ event: 'frameTick', cb })
          renderer.on('frameTick', cb)
        }

        // idle event
        if (config.hooks.idle) {
          const cb = () => {
            emit('idle', this[symbols.identifier], this)
          }
          this[symbols.rendererEventListeners].push({ event: 'idle', cb })
          renderer.on('idle', cb)
        }

        // fpsUpdate event
        if (config.hooks.fpsUpdate) {
          const cb = (r, data) => {
            emit('fpsUpdate', this[symbols.identifier], this, [data.fps])
          }
          this[symbols.rendererEventListeners].push({ event: 'fpsUpdate', cb })
          renderer.on('fpsUpdate', cb)
        }
      })

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
        this[symbols.wrapper].node.on('outOfBounds', () => {
          this.lifecycle.state = 'exit'
        })
      }
    }

    // setup (and execute) all the generated side effects based on the
    // reactive bindings define in the template
    const effects = config.code.effects
    for (let i = 0; i < effects.length; i++) {
      const eff = () => {
        effects[i](this, this[symbols.children], config, globalComponents, rootComponent, effect)
      }
      // store reference to the effect
      this[symbols.effects].push(eff)
      effect(eff)
    }

    // setup watchers if the components has watchers specified
    if (this[symbols.watchers]) {
      const watcherkeys = Object.keys(this[symbols.watchers])
      const watcherkeysLength = watcherkeys.length
      for (let i = 0; i < watcherkeysLength; i++) {
        let target = this
        let key = watcherkeys[i]
        const watchKey = key
        // when dot notation used, find the nested target
        if (key.indexOf('.') > -1) {
          const keys = key.split('.')
          key = keys.pop()
          for (let i = 0; i < keys.length; i++) {
            target = target[keys[i]]
          }
        }

        let old = this[key]

        const eff = (force = false) => {
          const newValue = target[key]
          if (old !== newValue || force === true) {
            this[symbols.watchers][watchKey].apply(this, [newValue, old])
            old = newValue
          }
        }

        // store reference to the effect
        this[symbols.effects].push(eff)
        effect(eff)
      }
    }

    // finaly set the lifecycle state to ready (in the next tick)
    setTimeout(() => (this.lifecycle.state = 'ready'))

    // and return this
    return this
  }

  /**
   * Component factory function
   * @typedef {BlitsComponentFactory}
   * @param {Object} options
   * @param {BlitsComponent} parentEl
   * @param {BlitsComponent} parentComponent
   * @param {BlitsComponent} rootComponent
   * @returns {BlitsComponent}
   */
  const factory = (options = {}, parentEl, parentComponent, rootComponent) => {
    if (Base[symbols['launched']] === false) {
      // Register user defined plugins once on the Base object (after launch)
      const pluginKeys = Object.keys(plugins)
      const pluginKeysLength = pluginKeys.length
      /** @type {Object} */
      const pluginInstances = {}
      for (let i = 0; i < pluginKeysLength; i++) {
        const pluginName = pluginKeys[i]
        const prefixedPluginName = `$${pluginName}`
        if (prefixedPluginName in Base) {
          Log.warn(
            `"${pluginName}" (this.${prefixedPluginName}) already exists as a property or plugin on the Base Component. You may be overwriting built-in functionality. Proceed with care!`
          )
        }

        const plugin = plugins[pluginName]

        pluginInstances[prefixedPluginName] = {
          // instantiate the plugin, passing in provided options
          value: Object.defineProperties(plugin.plugin(plugin.options), shared),
          writable: false,
          enumerable: true,
          configurable: true,
        }
      }

      Object.defineProperties(Base, pluginInstances)

      // expose other plugins inside each plugin
      for (const plugin in pluginInstances) {
        Object.defineProperties(Base[plugin], pluginInstances)
        // but remove reference to plugin itself
        delete Base[plugin][plugin]
      }

      // register global components once
      globalComponents = components()

      // mark launched true
      Base[symbols['launched']] = true
    }

    // setup the component once per component type, using Base as the prototype
    if (base === undefined) {
      Log.debug(`Setting up ${name} component`)
      base = setupComponent(Object.create(Base), config)
    }

    // one time code generation (only if precompilation is turned off)
    if (config.code === undefined) {
      Log.debug(`Generating code for ${name} component`)
      config.code = codegenerator.call(config, parser(config.template, name))
    }

    // create an instance of the component, using base as the prototype (which contains Base)
    return component.call(Object.create(base), options, parentEl, parentComponent, rootComponent)
  }

  // store the config on the factory, in order to access the config
  // during the code generation step
  factory[Symbol.for('config')] = config

  // To determine whether dynamic component is actual Blits component or not
  factory[symbols.isComponent] = true

  return factory
}

export default Component
