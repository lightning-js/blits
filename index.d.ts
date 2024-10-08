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

declare module '@lightningjs/blits' {

  interface Hooks {
    /**
    * Fires when the Component is being instantiated
    * At this moment child elements will not be available yet
    */
    init?: () => void;
    /**
    * Fires when the Component is fully initialized and ready for interaction.
    */
    ready?: () => void;
    /**
    * Triggers when the Component receives focus.
    *
    * This event can fire multiple times during the component's lifecycle
    */
    focus?: () => void;
    /**
    * Triggers when the Component loses focus.
    *
    * This event can fire multiple times during the component's lifecycle
    */
    unfocus?: () => void;
    /**
    * Fires when the Component is being destroyed and removed.
    */
    destroy?: () => void;
    /**
    * Fires upon each frame start  (allowing you to tap directly into the renderloop)
    *
    * Note: This hook will fire continuously, multiple times per second!
    */
    frameTick?: () => void;
    /**
    * Fires when the component enters the viewport _margin_ and is attached to the render tree
    *
    * This event can fire multiple times during the component's lifecycle
    */
    attach?: () => void;
    /**
    * Fires when the component leaves the viewport _margin_ and is detached from the render tree
    *
    * This event can fire multiple times during the component's lifecycle
    */
    detach?: () => void;
    /**
    * Fires when the component enters the visible viewport
    *
    * This event can fire multiple times during the component's lifecycle
    */
    enter?: () => void;
    /**
    * Fires when the component leaves the visible viewport
    *
    * This event can fire multiple times during the component's lifecycle
    */
    exit?: () => void;
  }

  interface Input {
    [key: string]: (event: KeyboardEvent) => void | undefined,
    /**
     * Catch all input function
     *
     * Will be invoked when there is no dedicated function for a certain key
    */
    // @ts-ignore
    any?: (event: KeyboardEvent) => void
  }

  type ComponentBase = {
    /**
    * Listen to events emitted by other components
    */
    $listen: {
      (event: string, callback: (args: any) => void, priority?: number): void;
    }
    /**
     * Emit events that other components can listen to
     * @param name - name of the event to be emitted
     * @param data - optional data to be passed along
     */
    $emit(name: string, data?: any): void;

    /**
    * Set a timeout that is automatically cleaned upon component destroy
    */
    $setTimeout: (callback: (args: any) => void, ms?: number | undefined) => ReturnType<typeof setTimeout>

    /**
    * Clear a timeout
    */
    $clearTimeout: (id: ReturnType<typeof setTimeout>) => void

    /**
    * Set an interval that is automatically cleaned upon component destroy
    */
    $setInterval: (callback: (args: any) => void, ms?: number | undefined) => ReturnType<typeof setInterval>

    /**
    * Clear a interval
    */
    $clearInterval: (id: ReturnType<typeof setInterval>) => void

    /**
    * Log to the console with prettier output and configurable debug levels in Settings
    */
    // $log: Log

    /**
    * Set focus to the Component, optionally pass a KeyboardEvent for instant event bubbling
    */
    $focus: (event?: KeyboardEvent) => void
    /**
     * @deprecated
     * Deprecated:  use `this.$focus()` instead
     */
    focus: (event?: KeyboardEvent) => void

    /**
    * Select a child Element or Component by ref
    *
    * Elements and Components in the template can have an optional ref argument.
    * Returns an Element Instance or Component Instance.
    * Useful for passing on the focus to a Child component.
    *
    * @example
    * ```js
    * const menu = this.$select('Menu')
    * if(menu) {
    *   menu.$focus()
    * }
    * ```
    */
    $select: (ref: string) => ComponentBase

    /**
     * @deprecated
     * Deprecated: use `this.$select()` instead
     */
    select: (ref: string) => ComponentContext // | ElementInstance

    /**
     * Announcer methods for screen reader support
     */
    // $announcer: Announcer

    /**
     * Triggers a forced update on state variables.
     */
    $trigger: (key: string) => void
    /**
     * @deprecated
     *
     * Triggers a forced update on state variables.
     * Deprecated: use `this.$trigger()` instead
     */
    trigger: (key: string) => void

    /**
     * Router instance
     */
    // $router: Router
  }

  /**
   * Prop object
   */
  type PropObject<T = any> = {
      key: string;
      type?: T;
  };

  // Props Array
  type PropsArray = (string | PropObject)[];

  // Extract the prop names from the props array
  type ExtractPropNames<P extends PropsArray> = {
      readonly [K in P[number] as K extends string ? K : K extends { key: infer Key } ? Key : never]: any;
  };

  // Update the PropsDefinition to handle props as strings or objects
  type PropsDefinition<P extends PropsArray> = ExtractPropNames<P>;

  type ComponentContext<P extends PropsArray, S, M, C> = ThisType<PropsDefinition<P> & S & M & C & ComponentBase>

  interface ComponentOptions<P extends PropsArray, S, M, C, W> {
    components?: {
        [key: string]: ComponentFactory,
    },
    /**
     * XML-based template string of the Component
     *
     * @example
     * ```xml
     * <Element :x="$x" w="400" h="1080" color="#64748b">
     *  <Element x="50" y="40">
     *   <Button color="#e4e4e7" />
     *   <Button color="#e4e4e7" y="100" />
     *   <Button color="#e4e4e7" y="200" />
     *   <Button color="#e4e4e7" y="300" />
     *  </Element>
     * </Element>
     * ```
     */
    template?: String,
    /**
     * Allowed props to be passed into the Component by the parent
     *
     * Can be a simple array with `prop` keys as strings.
     * Alternatively objects can be used to specify `required` props and `default` values
     *
     * @example
     * ```js
     * props: ['index', {
     *  key: 'alpha',
     *  required: true
     * }, {
     *  key: 'color',
     *  default: 'red'
     * }]
     * ```
     */
    props?: P;
    /**
     * Reactive internal state of the Component instance
     *
     * Should return an object (literal) with key value pairs.
     * Can contain nested objects, but beware that too deep nesting can have
     * a negative impact on performance
     *
     * @example
     * ```js
     * state() {
     *  return {
     *    items: [],
     *    color: 'red',
     *    alpha: 0.1
     *  }
     * }
     * ```
     */
    state?: () => S;
    /**
     * Methods for abstracting more complex business logic into separate function
     */
    methods?: M & ComponentContext<P, S, M, C>
    /**
     * Hooking into Lifecycle events
     */
    hooks?: Hooks & ComponentContext<P, S, M, C>
    /**
     * Tapping into user input
     */
    input?: Input & ComponentContext<P, S, M, C>
    /**
     * Computed properties
     */
    computed?: C & ComponentContext<P, S, M, C>
    /**
     * Watchers for changes to state variables, props or computed properties
     */
    watch?: W & ComponentContext<P, S, M, C>
  }

  interface ApplicationOptions<P extends PropsArray, S, M, C, W> extends ComponentOptions<P, S, M, C, W> {
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

  type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
  }[keyof T]

  interface RouteHooks {
    before?: (to: Route, from: Route) => string | Route;
  }

  type Route = {
    /**
     * URI path for the route
     */
    path: string,
    /**
     * Component to load when activating the route
     */
    component: ComponentFactory // todo: or promise returning a component instance
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
    /**
     * Register hooks for the route
     */
    hooks?: RouteHooks
    /**
     * Route path parameters
     */
    readonly params?: {
      [key: string]: string | number
    }
    /**
     * Allows for attaching custom data to a route, either hardcoded in the
     * route definition or asigned to the route object in a before hook
     *
     * Will be merged with the route params and navigation data and passed as
     * props into the route component
     */
    data?: {
      [key: string]: any
    }
  }

  type ComponentFactory = () => void

  /**
   * Blits App Framework
   */
  export interface Blits {
    /**
     * Blits Application
     */
    Application<P extends PropsArray, S, M, C, W>(options: ApplicationOptions<P, S, M, C, W>) : void
      /**
     * Blits Component
     */
    Component<P extends PropsArray, S, M, C, W>(name: string, options: ComponentOptions<P, S, M, C, W>) : ComponentFactory
    /**
     * Blits Launch
     */
    Launch() : void
    /**
     * Blits Plugin
     */
    Plugin() : void
  }

  const Blits: Blits;

  export default Blits;
}
