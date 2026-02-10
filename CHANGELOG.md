# Changelog


## v1.48.0

_10 feb 2026_

- Improved cleanup of for-loop effects
- Fixed router issue with params not being reset
- Added next tick debouncing for transitions on multiple props
- Bumped renderer to 2.21.0
- Added support for using function-notation in `@loaded`, `@error` and `@updated` callbacks
- Added displaying of correct component type in inspector data when using `is`-attribute
- Replaced `$`-prefix for automatic inspector data with `blits-` prefix (fixes fatal error in Safari)


## v1.47.0

_26 jan 2026_

- Fixed issue with reactivity guard vite plugin failing for commented-out code
- Fixed issue with autosizing of holder node by adding extra `eol` check
- Added support for _variants_ to the Theme plugin

## v1.46.0

_22 jan 2026_

- Improved Announcer on Comcast devices
- Added new `afterEach` router hook
- Added router option to dynamically disable `back`-key handling by the router
- Added `this.$debounce`-method
- Added automatic inspector data items (`$componentType`, `$hasFocus` and `$isTransitioning`)
- Added functionality to auto size the holder node of a Component when the wrapper Element has dimensions
- Bumped Lightning renderer to v2.20.4 with correct handling of failed textures

## v1.45.2

_13 jan 2026_

- Updated renderer to v2.20.2

## v1.45.1

_29 dec 2025_

- fixed issue `magic-string` package being a dev dependency

## v1.45.0

_29 dec 2025_

- Added support for defining types for custom plugins on the Blits component definitions
- Added importable type definitions for built-in plugins
- Added support for JS sourcemaps
- Added reactivity for shader props (individual shaders, not effects via dynamic shader)
- Fixed issue with usage of Blits plugins not working in for loops
- Improved test coverage

## v1.44.0

_20 Nov 2025_

- Added `$input` method to facilitate key handling _without_ also passing focus
- Added support for passing `type` of image in the `src`-attribute (`regular`, `svg`, `compressed` for cases the file type can't be derived from the file name)
- Bumped Lightning renderer to v2.20.0 with improved support for compressed textures


## v1.43.2

_13 Nov 2025_

- Fixed issue with endless loop in router when first page in history would fail an async before / beforeEach hook (introduced in v1.43.0)

## v1.43.1

_13 Nov 2025_

- Added arguments of fpsUpdate and frameTick hooks to type definitions

## v1.43.0

_12 Nov 2025_

- Exposed different renderer events as hooks (`idle`, `fpsUpdate` and `frameTick`)
- Added `$clearListeners` utility helper
- Added `$clearListeners` and `$unlisten` to type definitions
- Fixed issue with __DEV__ flag being set in vite config
- Fixed `lint` and `lint:fix` scripts to work cross platform (added Windows support)
- Added support for utterance options (`rate`, `pitch`, `lang`, `voice` and `volume`) to Announcer plugin
- Added reactivity to `src`-attribute of the Sprite
- Updates deprecated `assert` keyword for new `with` keyword


## v1.42.1

_28 Oct 2025_

- Updated to version 2.19.1 of the renderer
- Fixed scale animation snapping issue when using object notation with transitions (again)

## v1.42.0

_24 Oct 2025_


- Added effects prop support to Sprite component
- Added support for redirecting in before hooks returning a route object (with updated path)
- Fixed meta options on routes functionality
- Enhanced router hook test coverage
- Fixed scale animation snapping issue when using object notation with transitions

## v1.41.0

_16 Oct 2025_

- Improved overall test coverage to 86%
- Filtered out inspector-data entirely in production
- Improved vite plugin that handles computed props to be more robust
- Fixed issue with global reactive object that are deeply nested
- Bumped MSDF generator dependency to address security issues in dependencies

## v1.40.1

_10 Oct 2025_

- Downgraded renderer to 2.18.2

## v1.40.0

_10 Oct 2025_

- Improved memory management in the for loop by efficiently removing effects

## v1.39.4

_9 Oct 2025_

- Bumped Lightning renderer to 2.18.3


## v1.39.3

_2 Oct 2025_

- Bumped Lightning renderer to 2.18.2


## v1.39.2

_2 Oct 2025_

- Bumped Lightning renderer to 2.18.0


## v1.39.1

_26 Sept 2025_

- Bumped Lightning renderer to 2.17.0


## v1.39.0

_16 Sept 2025_

- Refactored router to be more performant and prevent runtime route changes to affect other route instances

## v1.38.3

_4 Sept 2025_

- Fixed clearing of `idle` and `frameTick` hooks upon component destroy
- Fixed updating of router state to before init hook

## v1.38.2

_1 Sept 2025_

- Fixed issue with `reuseComponent` storing the same page multiple times
- Fixed last array patch method (sort) not triggering reactivity


## v1.38.1

_28 Aug 2025_

- Added guard around emiting events and selecting elements after Component destroy
- Fixed issue with `navigatingBack`

## v1.38.0

_26 Aug 2025_

- Added `reuseComponent` to route options to enable navigating to the same page and reusing the same page component instance

## v1.37.0

_22 Aug 2025_

- Added Route options check before checking passFocus flag
- Added support for additional metadata in Route config (for associating arbitrary data to a route)
- Upgraded dev dependencies to latest versions

## v1.36.0

_11 Aug 2025_

- Added `passFocus` option to route options to prevent focus being passed to page navigated to
- Added missing type definitions for Route options
- Fixed sidebar in docs
- Added debug log messages to Announcer
- Added `remove()` function as (preferred) alias for announcer `message.cancel()`
- Fixed issue with removing a messages causing an interrupt of current message being read out

## v1.35.5

_06 Aug 2025_

-  Fixed timing routerview causing focus to be passed to previous page


## v1.35.4

_03 Aug 2025_

- Changed order of `focus`-hook and `hasFocus` variable to distinguish between focus and refocus
- Updated focus related documentation

## v1.35.3

_31 Jul 2025_

- Fixed issue with navigation data being overridden by route data.
- Fixed issue with incorrect focus chain paths.

## v1.35.2

_25 Jul 2025_

- Fixed issue with focus getting lost when destroying a focused component
- Fixed issue with refocusing a component that's already in the focus chain (i.e. `this.parent.$focus()`)

## v1.35.1

_24 Jul 2025_

- (Re) added next tick when setting focus to prevent any potential race conditions

_22 Jul 2025_

## v1.35.0

- Added `byReference` param to `this.$emit()` to allow passing data without passing it by reference
- Refactored focus handling
  - more performant
  - more robust for reassigning focus programatically (i.e. without direct key handling)
  - fixed some cases where `$hasFocus` flag wasn't reset upon unfocus
  - add logging of active focus chain upon focus changes
- Improved overall test coverage to almost 80% (Blits Element, Focus, Theme plugin, Storage plugin)

_10 Jul 2025_

## v1.34.0

- Added storage plugin
- Improved test coverage
- Fixed announcer plugin to work on RDK devices where early GC was happening
- Added check to throttle only the same input key in a row
- Updated docs on transitions
- Added warning when using `hasFocus` in component state

_08 Jul 2025_

## v1.33.0

- Added dereferencing of previousFocus pointer to ensure memory cleanup
- Improved cleanup of components (via explicit dereference of closure scope)
- Optimized time function in logger
- Optimized initial registration of routes
- Added `maxFPS` launch setting

_04 Jul 2025_

## v1.32.1

- Fixed issue with router data overwriting the orginal route definition

_02 Jul 2025_

## v1.32.0

- Added global router hooks `init` and `error`
- Fixed issues with `this` scope in global router hooks
- Fixed issue with `data` in `beforeEach` route not being complete
- Added input throttling functionality
- Optimized performance of children retrieval in `<Layout>`
- Added documentation on global router hooks

_30 Jun 2025_

## v1.31.1

- Upgraded renderer to v2.15.0

_30 Jun 2025_

## v1.31.1

- Upgraded renderer to v2.14.4

_27 jun 2025_

## v1.31.0

- Added dereferencing of previousFocus pointer to ensure memory release
- Added npm ignore to reduce NPM package size
- Added support for precompilation of `.mjs` files
- Upgraded renderer to v2.14.3


_25 jun 2025_

## v1.30.2

- Bumped renderer to v2.14.2


_25 jun 2025_

## v1.30.1

- Bumped renderer to v2.14.1


_24 jun 2025_

## v1.30.0

- Added documentation on lazy loading performance
- Bumped renderer to v2.14.0 (simplified texture throttling)
- Fixed bug in announcer when utterance is cancelled


_12 jun 2025_

## v1.29.5

- Simplified timeout and interval cleanup
- Added explicit reset of component state upon destruction
- Fixed `exit` lifecycle hook

_06 jun 2025_

## v1.29.4

- Removed excessive shader creation for effects
- Added explicit cleanup of effects in for loop
- Improved element destruction

_03 jun 2025_

## v1.29.3

- Added first batch internal JS doc types
- Added documentation on Launch settings
- Fixed issue with reactivity effects being shared (and retained) on the prototype

_28 may 2025_

## v1.29.2

- Added end of life flag to prevent timers, intervals and listeners to be registered after component destroy

_22 may 2025_

## v1.29.1

- Fixed issue with async and lifecycle ready error


_22 may 2025_

## v1.29.0

- Fixed memory leaks
- Added componentId in warning when modifying props directly for easier debugging

_15 apr 2025_

## v1.28.0

- Added graceful handling of announcer when speechSynthesis API is not available
- Renamed `beforeAll` method on router to `beforeEach` (as specified in the type definitions)
- Fixed detection of correct PR to comment for github workflows

_15 apr 2025_

## v1.27.1

- Fixed issue with global watcher on router state not being cleared out
- Minor performance updates
- Fixed issue with retrieving correct renderer version for logging
- Fixed issue with nested layouts not properly updating parent layout

_11 apr 2025_

## v1.27.0

- Added pre push linting check
- Updated Github workflow for tests
- Added noop announcement for when announcer is disabled
- Add ability to interrupt specific announcement messages

_09 apr 2025_

## v1.26.1 / v1.26.2

- Fixed issue with announcer queue

_08 apr 2025_

## v1.26.0

- Announcer updates: queue, cancel individual messages, promise based chaining
- Fixed naming collision for `config`-key on component instance
- Fixed logging correct renderer version

## v1.25.1

_01 apr 2025_

- Fixed issue with page rendering after being destroyed when data is loaded by an async request

## v1.25.0

_28 mar 2025_

- Fixed issue when same effect type is used in `effects` attribute
- Added ability to enable / disable announcer via launch setting as well as runtime

## v1.24.0

_26 mar 2025_

- Added additional tests for router
- Fixed issues with `:show` attribute not working properly
- Fixed issue with strings starting with a number being casted to a number
- Fixed named slots functionality

## v1.23.2

_18 mar 2025_

- Fixed issue with keepAlive pages remaining in cache after navigating back

## v1.23.1

_17 mar 2025_

- Fixed issue in vite plugin that ensures reacitivity setup in computed props when code block has a comment
- Fixed warnings for non-declared variables in template when they refer to plugins (i.e. `$$apState.foo`)

## v1.23.0

_13 mar 2025_

- Added support for beforeEach router hook
- Added warning when variables used in the template are not declared on the component scope (only during dev)
- Added vite plugin that ensures reactivity is setup properly for all state variables in a computed prop
- Fixed keepAlive functionality in the router on back navigation
- Fixed various test cases
- Added useful base methods to the this context of plugins
- Added workflow to execute test cases for PRs
- Updated L3 renderer dependency to v2.13.2
- Fixed various typos in the documentation
- Fixed reactivity issue when value is set to `null`

## v1.22.0

_3 mar 2025_

- Added default value for `createImageBitmapSupport` to `auto`
- Added advanced launch settings

## v1.21.1

_28 feb 2025_

- Changed gpuMemory launch settings to be optional in type definitions

## v1.21.0

_27 feb 2025_

- Added functionality for keeping query params when navigating back in the router
- Exposed more info in reactive router state
- Added `range`-attribute to for-loop
- Fixed issue when setting `alpha` to truthy or false values
- Upgraded to renderer v2.13.0

## v1.20.1

_14 feb 2025_

- Added error message when root element in template contains a `:for`-attribute
- Added workaround fix for shader caching issue
- Upgraded to renderer v2.12.1

## v1.20.0

_12 feb 2025_

- Improved attribute definitions used for autocompletion in VScode extension
- Fixed calculation of `align-items` in Layout component
- Fixed issue with sorting reactive arrays
- Upgraded to renderer v2.12.0

## v1.19.1

_3 feb 2025_

- Removed left-over console.log
- Upgraded to renderer v2.11.1
- Fixed issues with wrongly pre-compiling `template` key of non-blits related objects

## v1.19.0

_31 jan 2025_

- Fixed `show`-attribute when an `alpha`-attribute is also present
- Added `inspector-data`-attribute to help with automated testing based on the Lightning inspector
- Added reactivity to Route changes (`this.$router.state.path` and `this.$router.state.navigating`)
- Added `renderQuality` launch setting

## v1.18.1

_27 jan 2025_

- Fixed issue with navigating back to a router page with `keepalive=true`

## v1.18.0

_27 jan 2025_

- Added backtracking functionality to the Router
- Upgraded to latest version of the renderer (2.10.0)
- Changed setting `textureProcessingLimit` to `textureProcessingTimeLimit`


## v1.17.1

_24 jan 2025_

- Fixed issue in sprite

## v1.17.0

_24 jan 2025_

- Deprecated `wordwrap`-attribute on Text component in favour of `maxwidth`
- Added documentation about text overflow
- Upgraded renderer to v2.9.1 and added `canvas` and `textureProcessingLimit` launch options

## v1.16.2

_21 jan 2025_

- Upgraded to latest version of MSDF font generator, with fix for missing presets


## v1.16.1

_17 jan 2025_

- Fixed issue in certain browsers caused by route query params functionality (and optimized for performance)


## v1.16.0

_16 jan 2025_

- Fixed issue with component scope in Slots
- Fixed issue with sprites (regression since v1.14.0)
- Changed reactive state to only make plain objects reactive, and return custom Classes, Blits components, Renderer texture etc in raw form

## v1.15.0

_14 jan 2025_

- Added `placement`-attribute for easily aligning Elements to predefined locations (i.e. `center`, `right`, `middle`, `bottom`)
- Removed automatic injection of `index` variable into forloop-scope to prevent unexpected naming collisions


## v1.14.1

_8 jan 2025_

- Fixed `undefined`-error with intercept method, when no input object is specified on root App component


## v1.14.0

_6 jan 2025_

- Added ability to deregister listeners (`this.$unlisten()`)
- Added autosize to images without `w` and `h` attributes
- Fixed cleanup of transitions and end-callbacks when Elements are destroyed
- Added support for reactively updating an entire object (instead of having to update each object key individually)
- Added `this.$size()` method to set the dimensions of a Component
- Added `intercept` input method to handle key presses before they reach the currently focused Component
- Added support for query-parameters in routes (in addition to regular query params)


## v1.13.1

_9 dec 2024_

- Fixed setting of correct color when turning off rtt on an element
- Added check for txManager in reactivity
- Fixed reference to correct `this`-scope in router before hook

## v1.13.0

_5 dec 2024_

- Added `padding` attribute to Layout component
- Added logging of Blits and Renderer version used in App
- Fixed show attribute for elements without predefined width and height
- Added automatic proxy fallback (when no browser support) for reactivity
- Fixed and added tests related to Blits Element
- Fixed memory issue with effects used in for-loop
- Fixed memory issue when changing props in dynamic shader effects
- Updated renderer to v2.8.0

## v1.12.0

_26 nov 2024_

- Fixed `$hasFocus` state variable not being set when navigating back to a page with `keepAlive` enabled
- Added `@updated`-event to Layout component
- Fixed issue with simple config for Theme plugin


## v1.11.0

_19 nov 2024_

- Added support for splitting up translation file per language
- Added hasFocus property to ComponentBase type
- Fixed issue with alpha during router transitions


## v1.10.1

_15 nov 2024_

- Upgraded to renderer 2.7.1
- Added documentation on Router


## v1.10.0

_8 nov 2024_

- Fixed issue with back button not bubbling to App component after last page in router history is popped
- Added `align-items` attribute to Layout component
- Fixed issue with watching nested state variables and global state
- Upgraded to renderer 2.6.2
- Fixed issue with white background for Elements with falsy src attribute
- Fixed issue with calling focus on component that already is focused


## v1.9.2

_5 nov 2024_

- Fixed Element related tests
- Bumped renderer to version 2.6.0

## v1.9.1

_4 nov 2024_

- Added fix for omitting gap-attribute in Layout component

## v1.9.0

_4 nov 2024_

- Added Layout component

## v1.8.3

_31 oct 2024_

- Exported TS interfaces and improved return type of before route hook
- Fixed test cases for codegenerator


## v1.8.2

_30 oct 2024_

- Fixed edge case issue with array based props not triggering reactivity


## v1.8.1

_29 oct 2024_

- Fixed issue with array based props not triggering reactivity
- Upgraded renderer to 2.5.1


## v1.8.0

_22 oct 2024_

- Refactored TypeScript definitions to give better autocompletion and general TS support for business logic
- Added option for custom characters in MSDF generated fonts
- Added export for symbols
- Upgraded renderer to 2.4.0
- Added transition progress event


## v1.7.1

_14 oct 2024_

- Fixed support for `.otf` and `.woff` fonts files in combination with MSDF generator


## v1.7.0

_14 oct 2024_

- Added cleanup upon component destroy of effects generated by global reactivity

## v1.6.0 / v1.6.1

_9 oct 2024_

- Abstracted app create functionality to separate package
- Cleaned up dependencies
- Fixed issue with item reference in for loop
- Fixed issue with looping directly over `<Text>` components

## v1.5.1

_7 oct 2024_

- Added export of symbols
- Various small performance improvements related to component creation

## v1.5.0

_1 oct 2024_

- Fixed issue with interrupting running / scheduled transitions with a new transition on the same prop
- Fixed issue with (incompatible) SDF text renderer being loaded when `renderMode` is set to canvas
- Added support for handling key release (i.e `keyup`) events

## v1.4.3

_26 sept 2024_

- Fixed issues with sprites in minified production build
- Bumped renderer to v2.2.0  (with fixes for nested alpha / show issue)
- Fixed reactivity in plugins not using reactivity mode setting
- Fixed named slots functionality

## v1.4.2

_24 sept 2024_

- Fixed timing issue with calculation of percentages
- Improved check to see if object is a Blits component, so it's more robust in case of code minification

## v1.4.1

_18 sept 2024_

- Fixed support for inspector, compatible with renderer 2.x changes

## v1.4.0

_16 sept 2024_

- Added support for `fit` attribute to enable resizeModes for images (cover, contain)
- Added priority parameter for event emitters + ability to stop propagation
- Added Global App State plugin
- Added Theme plugin
- Standardized built-in utility methods (i.e. focus, select, setTimeout, etc.) to all be prefixed with a `$`.
- Added support for triggering nested state variables with dot-notation (i.e `foo.bar.bla`)
- Added support for watching nested state variables (i.e `foo.bar.bla`)
- Fixed bug with Log plugin not picking up on `debugLevel` setting
- Fixed bug when using hex-colors in an effect
- Upgraded to latest version of the renderer (2.1.1)

## v1.3.1

_27 aug 2024_

- Moved `this.$log` functionality to a plugin, which delays the instantation and allows it to pick up launch settings (bug fix)

## v1.3.0

_19 aug 2024_

- Fixed bug in for-loop when key is not a string but a number
- Added `$shallow`-modifier to for-loop
- Added several performance optimizations
- Added support for dynamic arguments in object notation (i.e. `mount="{x: $x, y: $y}"`)

## v1.2.0

_5 aug 2024_

- Added plugin system for Blits
- Added Language plugin, modeled after L2-SDK Language plugin
- Removed unused built-in Image component
- Marked `this.trigger()`-method as deprecated in definition file
- Removed double assignment of `this.node` during element creation

## v1.1.0

_25 july 2024_

- Made `holdTimeout` configurable and added to launch settings
- Improved test coverage
- Removed imporChunkUrl dependency as it’s no longer needed
- Abstracted path from pre-compiler, to make it more reusable (in playground for example)
- Added `defaultFont` launch setting to boilerplate example

## v1.0.0

_15 july 2024_

- Added multiple optimizations that improve the performance
- Fixed mountY prop setting
- Added functionality for providing custom shaders
- Added initial support for accessing children
- Added first version of Layout component
- Improved test coverage
- Refactored transitions and fixed promise resolve issues
- Upgraded to renderer v1.0.0

## v0.10.0

_17 june 2024_

- Updated renderer to version v0.9.1
- Updated font generation to use the new `@lightningjs/msdf-generator`-package with required font metrics
- Added queue mechanism to font generation to prevent hanging process
- Added functionality to pass a component into the Component `:is` attribute

Please read refer to the [breaking changes](https://github.com/lightning-js/renderer/releases/tag/v0.9.0) in the
renderer related to MSDF fonts. When you have custom msdf fonts in your `/public` folder you may need to regenerate
them (or remove the files and let Blits take care of [generating for you from a `.ttf`](https://lightning-js.github.io/blits/#/essentials/displaying_text?id=using-custom-fonts))


## v0.9.9

_22 may 2024_

- Added support for `rtt`-attribute (Render To Texture)
- Refactored Component for efficiency and readability
- Improved type definitions
- Fixed error when no settings object is supplied to Launch method
- Fixed issue with `parent` variable being set on the global window object
- Improved code of firing transitions
- Bumped renderer to version 0.8.4

## v0.9.8

_25 apr 2024_

- Fixed issue with removing children during navigation with the router
- Added support for overflow (as an inversed alias of clipping)
- Upgraded to latest version of renderer (0.8.3)
- Introduced `renderMode` setting (`webgl` or `canvas`)

## v0.9.7

_15 apr 2024_

- Added support for direct assignment of an Array element and triggering reactivity
- Added support for .env in boilerplate
- Fixed issue with Blits component being wrapped in a Proxy when assigned to a state variable
- Fixed built-in `hasFocus`-state to also work for components that don't have state in their config object

## v0.9.6

_4 apr 2024_

- Added before hook to router
- Upgraded Lightning renderer to v0.8.2

## v0.9.5

_29 mar 2024_

- Fixed cancelling  of scheduled / running transitions when starting a new transition on the same prop (broke in v0.7.1).
- Added viewport relates lifecycle hooks

## v0.9.4

_28 mar 2024_

- Upgraded Lightning renderer to v0.8.0
- Fixed issue with reactivity in a forloop when initial array is empty
- Introduced new `gpuMemoryLimit` launch setting


## v0.9.3

_25 mar 2024_

- Added support for mount / pivot on Text elements and Sprites.

## v0.9.2

_21 mar 2024_

- Fixed issue with updates not triggering during array operation

## v0.9.1

_21 mar 2024_

- Improved support for reactive advanced array operations (i.e. `splice()`, `concat()`, `sort()`)
- Upgraded Lightning renderer to v0.7.6
- Reverted removal of destroy of child nodes (added in v0.8.1)
- Introduced `viewportMargin` setting
- Added `undefined`-check for props sent to renderer

## v0.9.0

_18 mar 2024_

- Added symbol for `id` on component
- Fixed issue in for loop when `:key` is a number (and not a string)
- Added built-in `hasFocus` state variable, available on every Component
- Refactored font loading, removed the need for temporary `src/fontLoader.js` file
- Replaced using component name with unique identifier for registering and emitting hooks

## v0.8.1

_9 mar 2024_

- Added pre-processing of hardcoded colors used in the template
- Upgraded Lightning renderer to v0.7.5
- Removed explicit destroy of child nodes, as the renderer now takes care of this
- Re-added support for clipping

## v0.8.0

_1 mar 2024_

- Added `this.$clearIntervals()` and `this.$clearTimeouts()` methods that clear all intervals and timers set on a certain component
- **Breaking change:** Renamed the key `function` to `easing` in the transitions object used to specify a custom easing functio (deprecation notice added)

## v0.7.4

_28 feb 2024_

- Fixed dependency for on the fly MSDF font generation

## v0.7.3

_28 feb 2024_

- Added functionality that forces focus hook to fire when parent receives focus from child
- Improved destroy sequence of nodes to be disposed
- Fixed issue with tracking reactive objects multiple times (potential max call stack error)
- Added on the fly MSDF font generation from a `.ttf` file placed in `publics/fonts`
- Added support for pre-compilation for files with more than 1 Blits component
- Fixed transitions on scale attribute when passed an object with `x` and `y` values

## v0.7.2

_23 feb 2024_

- Added small fix to support for (re)assigning an array used in a for-loop
- Added option to enable the Lightning inspector in launch setting (`inspector: true/false`)

## v0.7.1

_22 feb 2024_

- Fixed clean up of children nodes when routing to a new view
- Fixed test cases for code generator (100% coverage)
- Added support for colorizing sprites
- Removed before setup and setup lifecycle events and optimized lifecycle instance in components
- Added support for (re)assigning an array used in a for-loop
- Refactored delay of transitions (using the now available built-in delay in the renderer)
- Added preliminary support for frameTick hook
- Upgraded to latest version of the renderer (0.7.4)

## v0.7.0

_20 feb 2024_


- Added support for dynamic components through the `is`-attribute (`<Component is="Poster" />` or `<Component is="$dynamicComponent" />`)
- Added functionality to pass extra data / props when navigating to a new route ( _breaking change_ in signature of `router.to()` method - previously: `router.to(path, options)`, now: `router.to(path, data, options)`)
- Added configuration option to set the canvas color (aka clear color)

## v0.6.13

_16 feb 2024_

- Upgraded to 0.7.2 of the renderer
- Introduced new `maxheight` attribute (besided the existing `maxlines` attribute) for the `<Text />` component
- Fixed issue with order of lifecycle event emits
- Fixed logic to not unfoces a parent when it passes focus to a child
- Removed temporary fix for renderer issue [#123](https://github.com/lightning-js/renderer/issues/123)

## v0.6.12

_9 feb 2024_

- Added type hinting for `this.$clearInterval` and `this.$clearTimeout`
- Fixed issue with `.gitignore` in app create flow
- Added support for dynamic route parts in the router (i.e `/tv/:series/episodes/:episode`)

## v0.6.11

_7 feb 2024_

- Enabled the use of `type` as a component prop or state variable
- Removed setting focus to AppComponent on back key press in RouterView
- Fixed broken app create flow caused by missing dev dependencies in npx command (temporary fix)

## v0.6.10

_2 feb 2024_

- Added FPS counter from Example App as a built-in Blits component (available as `<FPScounter />`)
- Added precompilation to all built-in Blits components for increased performance
- Updated flow to create a new App project with an interactive prompt of questions (`npx @lightningjs/blits@latest`)
- Upgraded to latest version of the Lightning 3 renderer (0.7.1)

## v0.6.9

_31 jan 2024_

- Fixed single quote escaping for all browsers (removing sometimes unsupported negative lookahead)
- Fixed issue with focus when navigating back to a page that is kept in history

## v0.6.8

_29 jan 2024_

- Reverted fix (initially) empty for-loops

## v0.6.7

_26 jan 2024_

- Added `this.$clearInterval` and `this.$clearTimeout` helper functions to Component
- Updated Lightning renderer to version _0.7.0_
- Added `lineheight` and `textoverflow` attributes to `<Text />`-component
- Added setting for specifying maximum number of web workers to spawn (`webWorkersLimit`)
- Added fix for issue with setting up reactivity for (initially) empty for-loops

## v0.6.6

_24 jan 2024_

- Added temporary fix for renderer issue [#123](https://github.com/lightning-js/renderer/issues/123)
- Fixed issue with setting mount, pivot and scale values to zero (0) in object literal with x and y key
- Added automatic mapping of ref string to each item in a for-loop

## v0.6.5

_16 jan 2024_

- Added `path` to boilerplate vite.config.js for deployments in a sub folder
- Improved error handling in the template parser, with more contextual error messages

## v0.6.4

_15 jan 2024_

- Added fix for sprites not working on certain devices

## v0.6.3

_12 jan 2024_

- Removed prepending protocol and host from sprite image


## v0.6.2

_12 jan 2024_

- Fixed issue with Sprites not working correctly due to missing background color

## v0.6.1

_8 jan 2024_

- Fixed issue with using single quotes as Text content
- Added first Text-to-Speech / Announcer functionality

## v0.6.0

_4 jan 2024_

- Added pre-compilation functionality to improve performance. Requires an update to the `vite.config.js` to enable. Read more details in this [blog post](https://lightningjs.io/blogs/blitsPreCompilation.html)
- Added `defaultFont` to the Launch settings

## v0.5.10

_3 jan 2024_

- Updated and improved documentation
- Added `screenResolution` and `pixelRatio` options to settings

## v0.5.9

_21 dec 2023_

- Changed transition-end callback to receive real prop value from node
- Implemented symbol for `wrapper` on Component (freeing up the name wrapper to be used in Component state)
- Added functionality to prevent a route ending up in the history stack (route option: `inHistory: false`)
- Improved router backtracking logic
- Added functionality to override route options during navigation
- Upgraded to latest version of the renderer (0.6.1) which contains a fix for animations not finishing correctly

## v0.5.8

_15 dec 2023_

- Internal refactor of the `Element`

## v0.5.7

_13 dec 2023_

- Added history and backhandling to the router
- Linked effects directly to the available shaders exposed by the L3 renderer (starting 0.6.0)
- Added setting `reactivityMode` to control whether `Proxy` (default) or `defineProperty` is used to trigger reactive side effects

## v0.5.6

_11 dec 2023_

- Upgraded to version 0.6.0 of the Lightning 3 renderer

## v0.5.5

_5 dec 2023_

- Fixed regression in Slots functionality caused by forloop cleanup fix in 0.5.4

## v0.5.4

_5 dec 2023_

- Fixed issue with Components and Elements not always being cleaned up in forloop
- Added support for nested children inside a forloop on an Element

## v0.5.3

_4 dec 2023_

- Added transition `start` and tranition `end` callbacks

## v0.5.2

_30 nov 2023_

- Fixed issue in code generator leading to creation unnecessary child nodes
- Added focus handler to router view (that passes focus to the current active page)

## v0.5.1

_29 nov 2023_

- Fixed issue with unexpected unfocus
- Added fastforward of transitions on the same property
- Added functionality to skip focus change on key hold

## v0.5.0

_23 nov 2023_

- Introduced `wordwrap` and `maxlines` attributes on the Text-component, replacing the previous `w` and `h` attributes (breaking change!)

## v0.4.2

_22 nov 2023_

- Improved parser and added more template validation (i.e. one single root element in a template)
- Fixed typo in documentation

## v0.4.1

_13 nov 2023_

- Added support for using dynamic import of components in routes
- Added support for returning components in an async function / Promise in routes

## v0.4.0

_9 nov 2023_

- Fixed bug related to animating percentage based values
- Added (customizable) navigation transitions to the router
- Renamed `.eslintrc.js` to `.eslintrc.cjs` in boilerplate code to make linting work on new projects
- Fixed issue in Settings when the default value was set to `false`
- Replace underscored keys for private properties with Symbols
- Added `keepAlive` option to the router (i.e. keeping a page in memory when navigating to a new page)
- Introduced a `this.$trigger` function to force a reevaluation of a reactive value (without changing the value)
- Exposed `currentRoute`, `routes` and `navigating` on the `this.$router` object
- Upgraded to lates version of `@lightningjs/renderer` (v0.5.0)

## v0.3.15

_23 oct 2023_

- Added support for slots
- Added support for defining custom keymapping
- Improved error handling of the template parser

## v0.3.14

_19 oct 2023_

- Fixed error when `<Text />`-component doesn't have any content
- Removed generic escape key handler that closed the App
- Introduced `quit()`-method on the root Application component
- Updated to v0.4.0 of the renderer

## v0.3.13

_18 oct 2023_

- Added support for `borderTop`, `borderBottom`, `borderLeft`, `borderRight` and `grayScale` effects
- Fixed `@loaded` and `@error` events on `<Text/>` componenent only firing once (and not for each change)
- Fixed loading of web canvas2d fonts
- Fixed error when using `this`-reference in component state
- Added basic support for inline text (i.e. `<Text>My text with a {{$dynamic}} value</Text>`)

## v0.3.12

_17 oct 2023_

- Fixed path to logo on readme

## v0.3.11

_17 oct 2023_

- Added support for using [percentages](https://lightning-js.github.io/blits/#/element_attributes?id=using-percentages) in dimensions (`w` / `h`) and positioning (`x` / `y`)
- Refactored template parser to be more robust and throw errors when the template contains a syntax mistake
- Re-enabled tests (still depends on renderer version bump though)
- Added the new official Blits logo to the readme!

## v0.3.10

_9 oct 2023_

- Updated L3 renderer dependency to 0.3.6
- Renamed internal methods for creating textures and shaders


## v0.3.9

_5 oct 2023_

- Updated L3 renderer dependency to 0.3.3


## v0.3.8

_4 oct 2023_

- Added Blits VS code extension to recommended extensions


## v0.3.7

_3 oct 2023_

- Fixed reactivity issue when using `null` values in state


## v0.3.6

_2 oct 2023_

- Bumped version number of dependency in boilerplate


## v0.3.5

_2 oct 2023_

- Added workaround for Vite import chunk url plugin for fontloading

## v0.3.4

_27 sep 2023_

- Fixed issue with re-applying reactivity to already reactive props in forloop


## v0.3.3

_25 sep 2023_

- Added support for `@loaded` and `@error` events on Elements (and Text Component)


## v0.3.2

_22 sep 2023_

- Changed name of attribute to reference an Element or Component from `id` to `ref`


## v0.3.1

_20 sep 2023_

- Fixed Blits dependency in create App boilerplate package.json


## v0.3.0

_20 sep 2023_

Initial beta release of Blits ⚡️
