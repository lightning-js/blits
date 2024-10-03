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
       * Emit events that other components can listen to
       * @param name - name of the event to be emitted
       * @param data - optional data to be passed along
       */
      $emit(name: string, data?: any): void;
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

  type ComponentOptions<P extends PropsArray, S, M, C, W> = {
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

  /**
   * Blits App Framework
   */
  export interface Blits {
      /**
       * Blits Application
       */
      Application() : void
       /**
       * Blits Component
       */
      Component<P extends PropsArray, S, M, C, W>(name: string, options: ComponentOptions<P, S, M, C, W>) : void
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
