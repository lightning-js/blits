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

import {default as Component, ComponentInstance} from './component'

declare namespace Application {

  interface Transition {
    /**
     * Name of the prop to transition (i.e. 'x', 'y', 'alpha', 'color')
     */
    prop: string,
    /**
     * Value the prop should transition to (i.e. 0, 100, '#223388')
     */
    value: any,
    /**
     * Duration of the transition in milliseconds, defaults to 300
     */
    duration?: number,
    /**
     * Easing function to apply to the transition
     */
    easing?: string,
    /**
     * Delay before the transition starts in milliseconds
     */
    delay?: number
  }

  interface Before {
    /**
    * Name of the prop to set before the transition starts
    */
    prop: string,
    /**
     * Value the prop to set before the transition starts
     */
    value: any,
  }

  interface RouteTransition {
    /**
     * Setting or Array of Settings before new view enters into the router view
     */
    before: Before | Before[],
    /**
     * Transition or Array of Transitions for new view to enters into the router view
     */
    in: Transition | Transition[],
    /**
     * Transition or Array of Transitions for old view to leave the router view
     */
    out: Transition | Transition[],
  }

  type RouteTransitionFunction = (previousRoute: Route, currentRoute: Route) => RequireAtLeastOne<RouteTransition>

  interface RouteAnnounce {
    /**
     * Message to be announced
     */
    message: String,
    /**
     * Politeness level
     *
     * Defaults to 'off'
     */
    politeness?: 'off' | 'polite' | 'assertive'
  }

  function Application(
    config: Application.ApplicationConfig
  ) : Application.ApplicationInstance

  type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
  }[keyof T]

  type Route = {
    /**
     * URI path for the route
     */
    path: string,
    /**
     * Component to load when activating the route
     */
    component: typeof ComponentInstance,
    /**
     * Transition configuration for the route
     */
    transition?: RequireAtLeastOne<RouteTransition> | RouteTransitionFunction,
    /**
     * Extra route options
     */
    options?: object // todo: specify which options are available,
    /**
     * Message to be announced when visiting the route (often used for accessibility purposes)
     *
     * Can be either a `String` with the message or an object that defines the message and the
     * politeness level
     */
    announce?: String | RouteAnnounce
  }

  export interface ApplicationInstance extends ComponentInstance {}

  export interface ApplicationConfig extends Component.ComponentConfig {
    /**
     * Routes definition
     *
     * @example
     *
     * ```js
     * routes: [
     *  { path: '/', component: Home },
     *  { path: '/details', component: Details },
     *  { path: '/account', component: Account },
     * ]
     * ```
     */
    routes?: Route[]
  }
}

/**
 * Blits.Application()
 *
 * Root App component
 */
declare function Application(
  config: Application.ApplicationConfig
) : Application.ApplicationInstance

export default Application;
