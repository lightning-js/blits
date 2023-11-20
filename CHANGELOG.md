# Changelog

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
