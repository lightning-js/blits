# Changelog

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
