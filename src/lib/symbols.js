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

/**
 * Symbol registry for internal framework properties and generated code.
 *
 * @typedef {Object} BlitsSymbols
 * @property {symbol} cleanup
 * @property {symbol} currentView
 * @property {symbol} cursorTagStart
 * @property {symbol} computedKeys
 * @property {symbol} destroy
 * @property {symbol} rendererEventListeners
 * @property {symbol} getChildren
 * @property {symbol} holder
 * @property {symbol} id
 * @property {symbol} identifier
 * @property {symbol} index
 * @property {symbol} init
 * @property {symbol} inputEvents
 * @property {symbol} internalEvent
 * @property {symbol} intervals
 * @property {symbol} debounces
 * @property {symbol} isProxy
 * @property {symbol} launched
 * @property {symbol} level
 * @property {symbol} methodKeys
 * @property {symbol} originalState
 * @property {symbol} propKeys
 * @property {symbol} raw
 * @property {symbol} ready
 * @property {symbol} renderer
 * @property {symbol} routes
 * @property {symbol} routerHooks
 * @property {symbol} settings
 * @property {symbol} state
 * @property {symbol} stateKeys
 * @property {symbol} textnode
 * @property {symbol} timeouts
 * @property {symbol} type
 * @property {symbol} watchers
 * @property {symbol} watchKeys
 * @property {symbol} wrapper
 * @property {symbol} children
 * @property {symbol} components
 * @property {symbol} config
 * @property {symbol} isSlot
 * @property {symbol} props
 * @property {symbol} slots
 * @property {symbol} componentType
 * @property {symbol} isComponent
 * @property {symbol} effects
 * @property {symbol} removeGlobalEffects
 */

/**
 * Internal symbol registry for Blits framework and generated code.
 *
 * @type {BlitsSymbols}
 */
export default {
  cleanup: Symbol('cleanup'),
  currentView: Symbol('currentView'),
  cursorTagStart: Symbol('cursorTagStart'),
  computedKeys: Symbol('computedKeys'),
  destroy: Symbol('destroy'),
  rendererEventListeners: Symbol('rendererEventListeners'),
  getChildren: Symbol('getChildren'),
  holder: Symbol('holder'),
  id: Symbol('id'),
  identifier: Symbol('identifier'),
  index: Symbol('index'),
  init: Symbol('init'),
  inputEvents: Symbol('inputEvents'),
  internalEvent: Symbol('internalEvent'),
  intervals: Symbol('intervals'),
  debounces: Symbol('debounces'),
  isProxy: Symbol('isProxy'),
  launched: Symbol('launched'),
  level: Symbol('level'),
  methodKeys: Symbol('methodKeys'),
  originalState: Symbol('originalState'),
  propKeys: Symbol('propKeys'),
  raw: Symbol('raw'),
  ready: Symbol('ready'),
  renderer: Symbol('renderer'),
  routes: Symbol('routes'),
  routerHooks: Symbol('routerHooks'),
  settings: Symbol('settings'),
  state: Symbol('state'),
  stateKeys: Symbol('stateKeys'),
  textnode: Symbol('textnode'),
  timeouts: Symbol('timeouts'),
  type: Symbol('type'),
  watchers: Symbol('watchers'),
  watchKeys: Symbol('watchKeys'),
  wrapper: Symbol('wrapper'),

  /* Utilizing the global Symbol registry for the following purposes */

  // Symbol 'children' utilized within generated code
  children: Symbol.for('children'),
  // Symbol 'components' utilized within generated code
  components: Symbol.for('components'),
  // Symbol 'config' utilized within generated code
  config: Symbol.for('config'),
  // Symbol 'isSlot' utilized within generated code
  isSlot: Symbol.for('isSlot'),
  // Symbol 'props' utilized within generated code
  props: Symbol.for('props'),
  // Symbol 'slots' utilized within generated code
  slots: Symbol.for('slots'),
  // Symbol 'componentType' utilized within generated code
  componentType: Symbol.for('componentType'),
  // Symbol 'isComponent' utilized within generated code
  isComponent: Symbol.for('isComponent'),
  // Symbol 'effects' utilized within generated code
  effects: Symbol.for('effects'),
  // Symbol 'removeGlobalEffects' utilized within generated code
  removeGlobalEffects: Symbol.for('removeGlobalEffects'),
}
