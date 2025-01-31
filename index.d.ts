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

import {type ShaderEffect as RendererShaderEffect, type WebGlCoreShader} from '@lightningjs/renderer'

declare module '@lightningjs/blits' {

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

  export interface Input {
    [key: string]: (event: KeyboardEvent) => void | undefined | unknown,
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

  // todo: specify valid route options
  export interface RouteOptions {
    [key: string]: any
  }

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

  export type ComponentBase = {
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
    $log: Log

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
    select: (ref: string) => ComponentBase

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

  export interface ApplicationConfig<P extends Props, S, M, C, W> extends ComponentConfig<P, S, M, C, W> {
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
     */
    gpuMemoryLimit?: number,
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
    textureProcessingTimeLimit?: number
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
