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

// blits file type reference
/// <reference path="./blits.d.ts" />

declare module '@lightningjs/blits' {
  type RendererShaderEffect = import('@lightningjs/renderer').ShaderEffect
  type WebGlCoreShader = import('@lightningjs/renderer').WebGlCoreShader
  type RendererMainSettings = import('@lightningjs/renderer').RendererMainSettings

  export interface AnnouncerUtteranceOptions {
    /**
     * Language code (BCP 47 format, e.g., 'en-US', 'fr-FR')
     *
     * @default 'en-US'
     */
    lang?: string,
    /**
     * Voice pitch (0 to 2, where 1 is normal)
     *
     * @default 1
     */
    pitch?: number,
    /**
     * Speech rate (0.1 to 10, where 1 is normal)
     *
     * @default 1
     */
    rate?: number,
    /**
     * Voice to use (obtained from `speechSynthesis.getVoices()`)
     *
     * @default null
     */
    voice?: SpeechSynthesisVoice | null,
    /**
     * Volume level (0 to 1, where 1 is full volume)
     *
     * @default 1
     */
    volume?: number,
  }

  export interface AnnouncerUtterance<T = any> extends Promise<T> {
    /**
     * Removes a specific message from the announcement queue,
     * to make sure it isn't spoke out.
     *
     * Does not interupt the message when it's already being announced.
     */
    cancel()
    /**
     * Interrupts a specific message as it is being spoken out by the Text to Speech
     * engine.
     */
    stop()
  }

  export interface Announcer {
    /**
     * Instruct the Announcer to speak a message. Will add the message
     * to the end of announcement queue by default
     *
     * When a message is added with politeness set to `assertive` the message
     * will be added to the beginning of the queue
     *
     * @param message - The message to be spoken
     * @param politeness - Politeness level ('off', 'polite', or 'assertive')
     * @param options - Optional utterance options (rate, pitch, lang, voice, volume)
     */
    speak(message: string | number, politeness?: 'off' | 'polite' | 'assertive', options?: AnnouncerUtteranceOptions): AnnouncerUtterance;
    /**
     * Instruct the Announcer to speak a message with 'polite' politeness level.
     * Will add the message to the end of announcement queue.
     *
     * @param message - The message to be spoken
     * @param options - Optional utterance options (rate, pitch, lang, voice, volume)
     */
    polite(message: string | number, options?: AnnouncerUtteranceOptions): AnnouncerUtterance;
    /**
     * Instruct the Announcer to speak a message with 'assertive' politeness level.
     * Will add the message to the beginning of announcement queue.
     *
     * @param message - The message to be spoken
     * @param options - Optional utterance options (rate, pitch, lang, voice, volume)
     */
    assertive(message: string | number, options?: AnnouncerUtteranceOptions): AnnouncerUtterance;
    /**
     * Configure global default utterance options that will be applied to all
     * subsequent announcements unless overridden by per-call options.
     *
     * @param options - Default utterance options (rate, pitch, lang, voice, volume)
     */
    configure(options?: AnnouncerUtteranceOptions): void;
    /**
     * Instruct the Announcer to add a pause of a certain duration (in ms). Will add this pause
     * to the end of announcement queue
     *
     */
    pause(delay: number): AnnouncerUtterance;
    /**
     * Interupts and instantly stops any running text to speech utterance
     *
     */
    stop(): void;
    /**
     * Clears out the announcement queue of messages.
     */
    clear(): void;
    /**
     * Enables the announcer.
     */
    enable(): void;
    /**
     * Disables the announcer. Any messages passed in the announcer.speak() message
     * will not be added to the queue
     */
    disable(): void;
    /**
     * Toggles the announcer based on the passed toggle value (Boolean)
     */
    toggle(toggle: Boolean): void;
  }


  export interface Hooks {
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
    frameTick?: (data: {time: number, delta: number}) => void;
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
    /**
    * Fires when the renderer is done rendering and enters an idle state
    *
    * Note: This event can fire multiple times
    */
    idle?: () => void;
    /**
    * Fires at a predefined interval and reports the current FPS value
    *
    * Note: This event fire multiple times
    */
    fpsUpdate?: (fps: number) => void;
  }

  export interface Input {
    [key: string]: ((event: KeyboardEvent) => unknown) | undefined,
    /**
     * Catch all input function
     *
     * Will be invoked when there is no dedicated function for a certain key
    */
    // @ts-ignore
    any?: (event: KeyboardEvent) => void,
    /**
     * Intercept key presses on the root Application component before being handled
     * by the currently focused component.
     *
     * Only when a KeyboardEvent (the original one, or a modified one) is returned from the
     * intercept function, the Input event is passed on to the Component with focus.
     *
     * The intercept function can be asynchronous.
     *
     * Note: the intercept input handler is only available on the Root App component (i.e. Blits.Application)
     */
    intercept?: (event: KeyboardEvent) => KeyboardEvent | Promise<KeyboardEvent | any> | any
  }

  export interface Log {
    /**
    * Log an info message
    */
    info(...args): typeof console.info
    /**
    * Log an error message
    */
    error(...args): typeof console.error
    /**
    * Log a warning
    */
    warn(...args): typeof console.warn
    /**
    * Log a debug message
    */
    debug(...args): typeof console.debug
  }



  export interface RouteData {
    [key: string]: any
  }

  /**
   * Router Options that can be used at the same time.
   */
  interface ConcurrentRouteOpts {
    /**
     * Whether the page navigation should be added to the history stack
     * used when navigating back using `this.$router.back()`
     *
     * @default true
     */
    inHistory?: boolean,
    passFocus?: boolean,
  }

  /**
   * Route Options that can't be true at the same time
   */
  type MutualExclusiveRouteOpts = {
    /**
     * Whether the router should reuse the current page component instance (when matching with the Component
     * specified for the route that we're routing to).
     *
     * @default true
     */
    reuseComponent?: true,
    /**
     * Whether the page should be kept alive when navigating away. Can be useful
     * for a homepage where the state should be fully retained when navigating back
     * from a details page
     *
     * @default false
     */
    keepAlive?: false
  } | {
    /**
     * Whether the router should reuse the current page component instance (when matching with the Component
     * specified for the route that we're routing to).
     *
     * @default true
     */
    reuseComponent?: false,
    /**
     * Whether the page should be kept alive when navigating away. Can be useful
     * for a homepage where the state should be fully retained when navigating back
     * from a details page
     *
     * @default false
     */
    keepAlive?: true
  }
  export type RouteOptions = ConcurrentRouteOpts & MutualExclusiveRouteOpts;

  export interface Router {
    /**
     * Navigate to a different location
     *
     * @param {string}
    */
    to(location: string, data?: RouteData, options?: RouteOptions): void;

    /**
     * Navigate to the previous location
    */
    back(): boolean;

    /**
     * Enable or disable RouterView history navigation on Back input
     */
    backNavigation: boolean;

    /**
     * Get the current route read-only
    */
    readonly currentRoute: Route;

    /**
     * Get the list of all routes
    */
    readonly routes: Route[];

    /**
     * Get navigating state
    */
    readonly navigating: boolean;

    /**
     * Reactive router state
    */
    state: {
      /**
       * Path of the current route
       *
       * Can be used in:
       * - a template as `$$router.state.path`
       * - inside business logic as `this.$router.state.path`
       * - as a watcher as `$router.state.path(v) {}`
       */
      readonly path: string
      /**
       * Whether or not the router is currently in the process of navigating
       * between pages
       *
       * Can be used in:
       * - a template as `$$router.state.navihating`
       * - inside business logic as `this.$router.state.navigating`
       * - as a watcher as `$router.state.navigating(v) {}`
       */
      readonly navigating: boolean
    }
  }

  // Extension point for app- and plugin-specific fields on the component `this`.
  // Add your own properties (e.g., `$telemetry`, `componentName`) via TypeScript
  // module augmentation in your app, without changing core types.
  // Note: `ComponentBase` extends this interface, so augmented fields appear in all
  // hooks, methods, input, computed, and watch.
  export interface CustomComponentProperties {
    // Empty by design: extend in your app via TypeScript module augmentation.
  }


  export interface ComponentBase extends CustomComponentProperties {
    /**
    * Indicates whether the component currently has focus
    *
    * @returns Boolean
    */
    hasFocus: boolean,

    /**
    * Listen to events emitted by other components
    */
    $listen: {
      (event: string, callback: (args: any) => void, priority?: number): void;
    }

    /**
     * Remove an event listener previously registered with $listen
     */
    $unlisten: {
      (event: string): void;
    }

    /**
     * Emit events that other components can listen to
     * @param name - name of the event to be emitted
     * @param data - optional data to be passed along
     * @param byReference - whether or not to pass the data by reference.
     * The default behaviour is passing the data object by reference (`true`).
     * When explicitely passing `false` the object will be recursively cloned
     * and cleaned from any potential reactivity before emitting
     */
    $emit(name: string, data?: any, byReference?: boolean): void;

    /**
     * Remove all listeners for this component from all events
     */
    $clearListeners: {
      (): void;
    }

    /**
    * Set a timeout that is automatically cleaned upon component destroy
    */
    $setTimeout: (callback: (args: any) => void, ms?: number | undefined) => ReturnType<typeof setTimeout>

    /**
    * Clear a timeout
    */
    $clearTimeout: (id: ReturnType<typeof setTimeout>) => void

    /**
    * Debounce a function execution, preventing memory leaks and function re-allocation
    * @param name - Unique identifier for this debounce instance (unique per component instance)
    * @param callback - Function to debounce
    * @param ms - Delay in milliseconds
    * @param args - Arguments to pass to the callback
    */
    $debounce: (name: string, callback: (...args: any[]) => void, ms?: number, ...args: any[]) => ReturnType<typeof setTimeout>

    /**
    * Clear a specific debounce by name
    * @param name - The name of the debounce to clear
    */
    $clearDebounce: (name: string) => void

    /**
    * Clear all debounces registered on the component (automatically called on component destroy)
    */
    $clearDebounces: () => void

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
    $log: Log

    /**
    * Set focus to the Component, optionally pass a KeyboardEvent for instant event bubbling
    */
    $focus: (event?: KeyboardEvent) => void
    /**
     * Handle a keyboard event on this component without changing focus
     * @param event - The keyboard event to handle
     * @returns Returns true if this component or a parent component handled the event, false otherwise
     */
    $input: (event: KeyboardEvent) => boolean
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
    select: (ref: string) => ComponentBase

    /**
     * Announcer methods for screen reader support
     */
    $announcer: Announcer

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
    $router: Router
    /**
     * Dynamically set the size of a component holder node
     */
    $size: (dimensions: {
      /**
       * Component width
       */
      w: number,
      /**
       * Component height
       */
      h: number
    }) => void
  }

  /**
   * Prop object
   */
  export type PropObject = {
    /**
     * Name of the prop
     */
    key: string,
    /**
     * Whether the prop is required to be passed
     */
    required?: boolean,
    /**
     * Default value for the prop when omited
     */
    default?: any,
    /**
     * Cast the value of the prop
     *
     * @example
     * ```js
     * {
     *   cast: Number, // casts to a number
     *   cast: (v) => v.toUpperCase() // casts to uppercase
     * }
     * ```
     */
    cast?: () => any
  };

  // Props Array
  export type Props = (string | PropObject)[];

  // Extract the prop names from the props array
  type ExtractPropNames<P extends Props> = {
      readonly [K in P[number] as K extends string ? K : K extends { key: infer Key } ? Key : never]: any;
  };

  // Update the PropsDefinition to handle props as strings or objects
  export type PropsDefinition<P extends Props> = ExtractPropNames<P>;

  export type ComponentContext<P extends Props, S, M, C> = ThisType<PropsDefinition<P> & S & M & C & ComponentBase>

  export interface ComponentConfig<P extends Props, S, M, C, W> {
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
    state?: (this: PropsDefinition<P>) => S;
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

  export interface RouterHooks {
    init?: () => Promise<void> | void;
    beforeEach?: (to: Route, from: Route) => string | Route | Promise<string | Route> | void;
    error?: (err: string) => string | Route | Promise<string | Route> | void;
  }

  export interface RouterConfig<P extends Props, S, M, C> {
    /**
     * Register hooks for the router
     */
    hooks?: RouterHooks & ComponentContext<P, S, M, C>,

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

    /**
     * Enable or disable RouterView history navigation on Back input
     * 
     * @default true
     * 
     * @remarks
     * This is an app-wide setting that affects all RouterView instances in your application.
     * The router state is global and shared across all router instances.
     * 
     * @example
     * ```js
     * router: {
     *   backNavigation: false, // Disable automatic back navigation
     *   routes: [...]
     * }
     * ```
     */
    backNavigation?: boolean
  }

  export type ApplicationConfig<P extends Props, S, M, C, W> = ComponentConfig<P, S, M, C, W> & (
    {
      /**
       * Router Configuration
       */
      router?: RouterConfig<P, S, M, C>,
      routes?: never
    }
    |
    {
      router?: never
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
  )

  export interface Transition {
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

  export interface Before {
    /**
    * Name of the prop to set before the transition starts
    */
    prop: string,
    /**
     * Value the prop to set before the transition starts
     */
    value: any,
  }

  export interface RouteTransition {
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

  export type RouteTransitionFunction = (previousRoute: Route, currentRoute: Route) => RequireAtLeastOne<RouteTransition>

  export interface RouteAnnounce {
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

  export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
  }[keyof T]

  export interface RouteHooks {
    before?: (to: Route, from: Route) => string | Route | Promise<string | Route>;
  }

  export type Route = {
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
    options?: RouteOptions
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

    /**
     * Metadata attached to the route, can be used to add any arbitrary
     * data to a route such as `auth: true/false`, a route ID or route description
     * Note that this data is not reactive and not passed as props to components.
     * The metadata is available in the router `before` or `beforeEach` hooks
     *
     */
    meta?: {
      [key: string]: any
    }
  }

  type ComponentFactory = () => void

  // Launch Related

  type DebugLevel = 0 | 1 | 2
  type LogTypes = 'info' | 'warn' | 'error' | 'debug'

  interface WebFont {
    /**
    * Name of the font family
    */
    family: string,
    /**
    * Type of font (web)
    */
    type: 'web',
    /**
    * Location to the font file (i.e. `/fonts/OpenSans-Medium.ttf`)
    */
    file: string
  }

  interface SdfFontWithFile {
    /**
      * Location of the font file (i.e. `/fonts/OpenSans-Medium.ttf`)
      */
    file: string
  }

  interface SdfFontWithPngJson {
    /**
    * Location of the font map (i.e. `'/fonts/Lato-Regular.msdf.json'`)
    */
    json: string,
    /**
    * Location of the font png (i.e. `'/fonts/Lato-Regular.msdf.png'`)
    */
    png: string
  }

  type SdfFont = {
    /**
    * Name of the font family
    */
    family: string,
    /**
    * Type of font (web)
    */
    type: 'msdf' | 'sdf',
  } & (SdfFontWithFile | SdfFontWithPngJson)

  type Font = WebFont | SdfFont

  type ShaderEffect = {
    name: string,
    type: RendererShaderEffect
  }

  type Shader = {
    name: string,
    type: WebGlCoreShader
  }

  type ScreenResolutions = 'hd' | '720p' | 720 | 'fhd' | 'fullhd' | '1080p' | 1080 | '4k' | '2160p' | 2160
  type RenderQualities = 'low' | 'medium' | 'high' | 'retina' | number

  type ReactivityModes = 'Proxy' | 'defineProperty'
  type RenderModes = 'webgl' | 'canvas'

    /**
   * Settings
   *
   * Launcher function that sets up the Lightning renderer and instantiates
   * the Blits App
   */
  export interface Settings {
    /**
     * Width of the Application
     */
    w?: number,
    /**
     * Height of the Application
     */
    h?: number,
    /**
     * Whether to enable multithreaded
     */
    multithreaded?: boolean,
    /**
     * Debug level for console log messages
     */
    debugLevel?: DebugLevel | LogTypes[],
    /**
     * Fonts to be used in the Application
     */
    fonts?: Font[],
    /**
     * Effects to be used by DynamicShader
     */
    effects?: ShaderEffect[],
    /**
     * Shaders to be used in the application
     */
    shaders?: Shader[],
    /**
     * Default font family to use in the Application when no font attribute is specified
     * on a Text-component
     *
     * The default font must be registered in the `fonts` array in the settings.
     *
     * Defaults to `sans-serif` font family, which is the default of the Lightning Renderer
     */
    defaultFont?: string,
    /**
     * Custom keymapping
     */
    keymap?: object,
    /**
     * Mode of reactivity (`Proxy` or `defineProperty`)
     */
    reactivityMode?: ReactivityModes,
    /**
    * Screen resolution of the device, defining the pixelRatio used to convert dimensions
    * and positions in the App code to the actual device logical coordinates
    *
    * If not supplied, Blits will try to autodetect the device screen resolution. Otherwise
    * the exact dimensions and positions used the app code are used.
    *
    * Note: If the option `pixelRatio` is specified in the Settings object, this value will take presedence
    * over the screen resolution setting.
    *
    * Currently 3 screen resolutions are supported, which can be defined with different alias values:
    *
    * For 720x1280 (1px = 0.66666667px)
    * - hd
    * - 720p
    * - 720
    *
    * For 1080x1920 (1px = 1px)
    * - fhd
    * - fullhd
    * - 1080p
    * - 1080
    *
    * For 2160x3840 (1px = 2px)
    * - 4k
    * - 2160p
    * - 2160
    */
    screenResolution?: ScreenResolutions,
    /**
    * Controls the quality of the rendered App.
    *
    * Setting a lower quality leads to less detail on screen, but can positively affect overall
    * performance and smoothness of the App (i.e. a higher FPS).
    *
    * The render quality can be one of the following presets:
    *
    * - `low` => 66% quality
    * - `medium` => 85% quality
    * - `high` => 100% quality
    * - `retina` => 200% quality
    *
    * It's also possible to provide a custom value as a (decimal) number:
    *
    * - `0.2` => 20% quality
    * - `1.5` => 150% quality
    *
    * Defaults to 1 (high quality) when not specified
    */
    renderQuality?: RenderQualities,
    /**
    * Custom pixel ratio of the device used to convert dimensions
    * and positions in the App code to the actual device logical coordinates
    *
    * Takes presedence over the `screenResolution` setting
    *
    * Defaults to 1 if not specified
    */
    pixelRatio?: number
    /**
     * Interval in milliseconds to receive FPS updates
     *
     * @remarks
     * If set to `0`, FPS updates will be disabled.
     *
     * @defaultValue `1000` (disabled)
     */
    fpsInterval?: number
    /**
    * Maximum number of web workers to spin up simultaneously for offloading functionality such
    * as image loading to separate threads (when supported by the browser)
    *
    * If not specified defaults to the number of logical processers available as reported by
    * `navigator.hardwareConcurrency` (or 2 if `navigator.hardwareConcurrency` is not supported)
    */
    webWorkersLimit?: number
    /**
     * Background color of the canvas (also known as the clearColor)
     *
     * Can be a color name (red, blue, silver), a hexadecimal color (`#000000`, `#ccc`),
     * or a color number in rgba order (`0xff0033ff`)
     *
     * Defauls to transparent (`0x00000000`)
     *
     */
    canvasColor?: string,
    /**
     * Enable inspector
     *
     * Enables the inspector tool for debugging and inspecting the application, the node tree
     * will be replicated in the DOM and can be inspected using the browser's developer tools
     *
     * Defaults to `false`
     */
    inspector?: boolean,
    /**
     * Add an extra margin to the viewport for earlier pre-loading of elements and components
     *
     * By default the Lightning renderer, only renders elements that are inside the defined viewport.
     * Everything outside of these bounds is removed from the render tree.
     *
     * With the viewportMargin you have the option to _virtually_ increase the viewport area,
     * to expedite the pre-loading of elements and / or delay the unloading of elements depending
     * on their position in the (virtual) viewport
     *
     * The margin can be specified in 4 directions by defining an array [top, right, bottom, left],
     * or as a single number which is then applied to all 4 directions equally.
     *
     * Defaults to `0`
     */
    viewportMargin?: number | [number, number, number, number],
    /**
     * Threshold in `Megabytes` after which all the textures that are currently not visible
     * within the configured viewport margin will be be freed and cleaned up
     *
     * When passed `0` the threshold is disabled and textures will not be actively freed
     * and cleaned up
     *
     * Defaults to `200` (mb)
     * @deprecated
     * Deprecated:  use `gpuMemory` launch setting instead
     */
    gpuMemoryLimit?: number,
    /**
     * Configures the gpu memory settings used by the renderer
     */
    gpuMemory?: {
      /**
       * Maximum GPU memory threshold (in `mb`) after which
       * the renderer will immediately start cleaning up textures to free
       * up graphical memory
       *
       * When setting to `0`, texture memory management is disabled
       *
       * @default `200`
       */
      max?: number,
      /**
       * Target threshold of GPU memory usage, defined as a fraction of
       * the max threshold. The renderer will attempt to keep memory
       * usage below this target by cleaning up non-renderable textures
       *
       * @default `0.8`
       */
      target?: number,
      /**
       * Interval at which regular texture cleanups occur (in `ms`)
       *
       * @default `5000`
       */
      cleanupInterval?: number,
      /**
       * Baseline GPU memory usage of the App (in `mb`), without rendering any
       * textures. This value will be used as a basis when calculating
       * the total memory usage towards the max and target memory
       * usage
       *
       * @default `25`
       */
      baseline?: number,
      /**
       * Whether or not the max threshold should be considered
       * as a strict number that can not be exceeded in any way
       *
       * When set to `true`, new textures won't be created when the
       * max threshold has been reached, until agressive texture cleanup
       * has brought the memory back down
       *
       * @default false
       */
      strict?: boolean,
    },
    /**
     * Defines which mode the renderer should operate in: `webgl` or `canvas`
     *
     * SDF fonts are not supported in _canvas_ renderMode. Instead, _web_ fonts should
     * be used. Also note that Canvas2d rendering doesnt support the use of shaders.
     *
     * Defaults to `webgl`
     */
    renderMode?: RenderModes,

    /**
     * The time, in milliseconds, after which Blits considers a key press a _hold_ key press
     *
     * During a hold key press the focus delegation behaviour is different: when scrolling
     * through a long list, focus is not handed over to each individual list item, creating a
     * smoother experience
     *
     * Defaults to `50` (ms)
     */
    holdTimeout?: number,
    /**
     * Input throttle time in milliseconds to prevent rapid successive inputs
     *
     * Within the throttle window, only one input will be processed immediately.
     * Subsequent inputs _of the same key_ are ignored until the scheduled input is processed.
     *
     * Pressing a different key will be processed immediately.
     *
     * Set to `0` to disable input throttling.
     *
     * Defaults to `0` (disabled)
     */
    inputThrottle?: number,
    /**
     * Custom canvas object used to render the App to.
     *
     * When not provided, the Lightning renderer will create a
     * new Canvas element and inject it into the DOM
     */
    canvas?: HTMLCanvasElement,
    /**
     * The maximum amount of time the renderer is allowed to process textures in a
     * single frame. If the processing time exceeds this limit, the renderer will
     * skip processing the remaining textures and continue rendering the frame.
     *
     * Defaults to `10`
     */
    textureProcessingTimeLimit?: number,
    /**
     * Advanced renderer settings to override Blits launch settings, or configure
     * settings that are not officially exposed in Blits yet
     *
     * @important if you dont know what you're doing here, you probably shouldn't be doing it!
     */
    advanced?: Partial<RendererMainSettings>,
    /**
     * Whether or not the announcer should be activated on initialization
     *
     * When set to `false` announcements via `this.$annoucer.speak()` will
     * be ignored. When set to `true` announcement will be spoken out via the
     * text to speech API
     *
     * Announcer can be enabled / disabled run time as well via:
     * - this.$announcer.enable()
     * - this.$announcer.disable()
     * - this.$announcer.toggle(true/false)
     *
     * @default false
     */
    announcer?: boolean,
    /**
     * Global default utterance options for the announcer.
     *
     * These options will be applied to all announcements unless overridden
     * by per-call options passed to `speak()`, `polite()`, or `assertive()`.
     *
     * @example
     * ```js
     * announcerOptions: {
     *   rate: 1.0,
     *   pitch: 1.0,
     *   lang: 'en-US',
     *   volume: 1.0
     * }
     * ```
     */
    announcerOptions?: AnnouncerUtteranceOptions,
    /**
     * Maximum FPS at which the App will be rendered
     *
     * Lowering the maximum FPS value can improve the overall experience on lower end devices.
     * Targetting a lower FPS may gives the CPU more time to construct each frame leading to a smoother rendering.
     *
     * Defaults to `0` which means no maximum
     */
    maxFPS?: number
  }

  interface State {
    [key: string]: any
  }

  interface Methods {
    [key: string]: any
  }

  interface Watch {
    [key: string]: any
  }

  interface Computed {
    [key: string]: any
  }


  interface Plugin {
    /**
     * Name of the plugin. The plugin will be accessible on each Component's
     * `this` scope under this name, prefixed with a `$` (i.e. myplugin => `this.$myplugin`)
     */
    name: string,
    /**
     * Singleton function that will be used to instantiate the plugin.
     * Should do all necessary setup and ideally return an object with
     * properties or methods that can be used in the App
     */
    plugin: () => any
  }


  /**
   * Blits App Framework
   */
  export interface Blits {
    /**
     * Blits Application
     * @param {ApplicationConfig} config - Application Configuration object
     */
    Application<
      P extends Props,
      S extends State,
      M extends Methods,
      C extends Computed,
      W extends Watch>(config: ApplicationConfig<P, S, M, C, W>) : ComponentFactory
      /**
     * Blits Component
     * @param {string} name - The name of the Component
     * @param {ComponentConfig} config - Component Configuration object
     */
    Component<
      P extends Props,
      S extends State,
      M extends Methods,
      C extends Computed,
      W extends Watch>(name: string, config: ComponentConfig<P, S, M, C, W>) : ComponentFactory
    /**
     * Blits Launch
     */
    Launch(App: ComponentFactory, target: HTMLElement | String, settings?: Settings) : void
    /**
     * Blits Plugin
     *
     * @param plugin
     * Plugin object or singleton function that will be used to instantiate the
     * plugin. Should do all necessary setup and ideally return an object with
     * properties or methods that can be used in the App
     *
     * @param nameOrOptions
     * Name of the plugin or options object, to be passed into the plugin instantiation.
     *
     * When passing a string, the value will be used as **name** of the plugin. The plugin
     * will be accessible on each Component's `this` scope under this name, prefixed with a `$`
     * (i.e. myplugin => `this.$myplugin`)
     *
     * Passing a name is **required** when `plugin` argument is a singleton function
     *
     * When passing an object, the value will be considered to be an `options` object.
     * The options object will be passed into the plugin instantiation method. Can
     * be used to set default values
     *
     * @param options
     * Object with options to be passed into the plugin instantiation method.
     * Can be used to set default values
     */
    Plugin(plugin: Plugin, nameOrOptions?: string | object , options?: object) : void
  }

  const Blits: Blits;

  export default Blits;
}
