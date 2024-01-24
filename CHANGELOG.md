# Changelog

# v0.6.6

_24 jan 2024_

- Added temporary fix for renderer issue [#123](https://github.com/lightning-js/renderer/issues/123)
- Fixed issue with setting mount, pivot and scale values to zero (0) in object literal with x and y key
- Added automatic mapping of ref string to each item in a for-loop

# v0.6.5

_16 jan 2024_

- Added `path` to boilerplate vite.config.js for deployments in a sub folder
- Improved error handling in the template parser, with more contextual error messages

# v0.6.4

_15 jan 2024_

- Added fix for sprites not working on certain devices

# v0.6.3

_12 jan 2024_

- Removed prepending protocol and host from sprite image


# v0.6.2

_12 jan 2024_

- Fixed issue with Sprites not working correctly due to missing background color

# v0.6.1

_8 jan 2024_

- Fixed issue with using single quotes as Text content
- Added first Text-to-Speech / Announcer functionality

# v0.6.0

_4 jan 2024_

- Added pre-compilation functionality to improve performance. Requires an update to the `vite.config.js` to enable. Read more details in this [blog post](https://lightningjs.io/blogs/blitsPreCompilation.html)
- Added `defaultFont` to the Launch settings

# v0.5.10

_3 jan 2024_

- Updated and improved documentation
- Added `screenResolution` and `pixelRatio` options to settings

# v0.5.9

_21 dec 2023_

- Changed transition-end callback to receive real prop value from node
- Implemented symbol for `wrapper` on Component (freeing up the name wrapper to be used in Component state)
- Added functionality to prevent a route ending up in the history stack (route option: `inHistory: false`)
- Improved router backtracking logic
- Added functionality to override route options during navigation
- Upgraded to latest version of the renderer (0.6.1) which contains a fix for animations not finishing correctly

# v0.5.8

_15 dec 2023_

- Internal refactor of the `Element`

# v0.5.7

_13 dec 2023_

- Added history and backhandling to the router
- Linked effects directly to the available shaders exposed by the L3 renderer (starting 0.6.0)
- Added setting `reactivityMode` to control whether `Proxy` (default) or `defineProperty` is used to trigger reactive side effects

# v0.5.6

_11 dec 2023_

- Upgraded to version 0.6.0 of the Lightning 3 renderer

# v0.5.5

_5 dec 2023_

- Fixed regression in Slots functionality caused by forloop cleanup fix in 0.5.4

# v0.5.4

_5 dec 2023_

- Fixed issue with Components and Elements not always being cleaned up in forloop
- Added support for nested children inside a forloop on an Element

# v0.5.3

_4 dec 2023_

- Added transition `start` and tranition `end` callbacks

# v0.5.2

_30 nov 2023_

- Fixed issue in code generator leading to creation unnecessary child nodes
- Added focus handler to router view (that passes focus to the current active page)

# v0.5.1

_29 nov 2023_

- Fixed issue with unexpected unfocus
- Added fastforward of transitions on the same property
- Added functionality to skip focus change on key hold

# v0.5.0

_23 nov 2023_

- Introduced `wordwrap` and `maxlines` attributes on the Text-component, replacing the previous `w` and `h` attributes (breaking change!)

# v0.4.2

_22 nov 2023_

- Improved parser and added more template validation (i.e. one single root element in a template)
- Fixed typo in documentation

# v0.4.1

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
