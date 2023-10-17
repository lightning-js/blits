# Changelog


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
