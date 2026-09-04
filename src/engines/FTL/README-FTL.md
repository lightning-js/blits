# Blits + FTL renderer (phase 1)

Opt-in support for the new FTL renderer alongside the default Lightning 3
renderer. Select it per app via launch settings:

```js
Blits.Launch(App, 'app', {
  renderer: 'ftl', // default: 'l3'
  w: 1920,
  h: 1080,
})
```

Install the optional peer dependencies to use it:

```sh
npm i ftl animejs
```

For local development against sibling checkouts:

```json
{ "dependencies": { "ftl": "file:../ftl" } }
```

The FTL engine is resolved via dynamic import, so L3 apps never download or
parse FTL code.

## What works in phase 1 (core-only)

- Position/size (`x y w h`, incl. `%`), `z`, `rotation` (degrees), `mount`,
  `pivot`, `scale`, `alpha`, `show` (maps to FTL `visible`)
- Solid `color` (any `colors.normalize` format → FTL rgba floats)
- `src` images (raster; SVG needs explicit `w`/`h`), `@loaded` / `@error`
- Native sprites (`<Sprite image map frame>`): sheet via `createImage`,
  frames via `createTexture('subtexture')` with L3-identical map lookup
  (`{defaults, frames}`, flat maps, inline frame objects); `@loaded`
  subscribes on the frame texture (`@error` has no FTL failure signal and
  warns, like `src` images)
- Text (`content font size align maxwidth maxheight maxlines letterspacing
  lineheight contain textoverflow`), canvas text engine. Fonts whose entry
  points at a web-font file (`ttf/otf/woff`, including `type: 'msdf'` entries
  with a `file`) are loaded into the canvas engine; atlas-only entries fall
  back with a warning
- Flex `__layout` containers, `%` placement, router, focus, components
- `frameTick` / `idle` / `active` hooks, `fpsUpdate` (derived from ticks)
- Transitions/animations via AnimeJS (optional peer `animejs`, lazy-loaded
  in the FTL chunk only). All 16 Blits easings map to identical L3
  cubic-bezier curves; `start/progress/end` callbacks, delay, cancel and
  router `end`-promises work. Without the peer, transitions apply instantly
  with a warning
- `rounded` / `border` / `shadow` (all combos, reactive live updates),
  gradient `color` objects (`{top,bottom,left,right}` → linear gradient;
  single key degrades to solid), and `shader={type}` for built-in types
  (`linearGradient`, `radialGradient`, `holePunch`, effect combos)

## Known limitations (warn-and-continue, never silent)

- Custom `shaders:[]` types and string-form `shader="name"` need hand ports
- Gradient color objects map corner pairs to a diagonal linear gradient
  (approximation of L3's bilinear 4-corner blend); max 8 stops
- Effect shaders are WebGL-only (`renderMode: 'canvas'` renders unshaded)
- MSDF/SDF atlas-only fonts fall back to canvas text (specify a font `file`
  to silence)
- `inspector: true` ignored; `holder` interactivity ignored
- Mouse picking disabled (`enableMouse` is safe: hover just never resolves)
- `renderQuality` / `pixelRatio` / `gpuMemory` / `advanced` settings ignored
- `renderMode: 'canvas'` uses the FTL 2D canvas renderer

## Architecture

```
Blits core → stage.element (= FTL/element.js BlitsElement)
  → FTL/nodeAdapter.js (NodeAdapter contract, see ../common/nodeAdapter.js)
  → FTL Elements (ftlApp.createElement / createText / createImage + dirty())
```

`FTL/launch.js` maps Blits settings onto FTL
`main({ platform, renderer, text, config })` and returns a renderer facade
(`on/off/canvas/destroy`) that backs the global Blits `renderer` binding.

## Engine notes (bundling / boot pitfalls)

- Dynamic `import('ftl/...')` specifiers must stay static strings (no
  `@vite-ignore`, no variables) or the browser build emits bare specifiers
  that fail at runtime. The dev server additionally needs the `ftl/*` alias
  in the app's vite config (optional-peer externalization + export remaps).
- `webglRenderer(canvas, shaders)` requires an explicit `additionalShaders`
  array (an omitted arg is not enough — the default parameter only applies
  when the whole argument is undefined).
- FTL only starts loading an element's texture once it is renderable
  (`w>0 && h>0`) and flips out-of-bounds→in-bounds. Unmeasured Blits
  text/image nodes get a 1x1 provisional size until `autoSize`/`set`
  resolves them (mirrors L3's 1px text nodes).
- The canvas backing store (`w`/`h`) is fitted to the display with CSS
  (aspect preserved, refit on resize) unless the app passes its own sized
  canvas — so stage coordinates map to the visible area like L3.

## Roadmap

Custom shader ports, sprite textures, MSDF fonts, inspector metadata,
mouse picking via bounds walk, pixel-ratio support.
