/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import setupProps from './props.js'
import setupMethods from './methods.js'
import setupState from './state.js'
import setupComputed from './computed.js'
import setupInput from './input.js'
import setupRouter from './routes.js'
import setupWatch from './watch.js'

import { registerHooks } from '../../lib/hooks.js'

import symbols from '../../lib/symbols.js'

let counter = 0

export default function (component, config) {
  component[symbols.identifier] = ++counter

  component[symbols.effects] = []

  // setup hooks
  registerHooks(config.hooks, component[symbols.identifier])

  // setup props
  // if (config.props) // because of the default props like id - might change this
  setupProps(component, config.props)

  // // setup methods
  if (config.methods) setupMethods(component, config.methods)

  // // setup state
  setupState(component, config.state)

  // // setup computed
  if (config.computed) setupComputed(component, config.computed)

  // // setup watchers
  if (config.watch) setupWatch(component, config.watch)

  // // setup router
  if (config.router || config.routes) setupRouter(component, config.router || config.routes)

  // // setup input
  if (config.input) setupInput(component, config.input)

  return component
}
