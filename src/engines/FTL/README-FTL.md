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
- Text (`content font size align maxwidth maxheight maxlines letterspacing
  lineheight contain textoverflow`), canvas text engine. Fonts whose entry
  points at a web-font file (`ttf/otf/woff`, including `type: 'msdf'` entries
  with a `file`) are loaded into the canvas engine; atlas-only entries fall
  back with a warning
- Flex `__layout` containers, `%` placement, router, focus, components
- `frameTick` / `idle` / `active` hooks, `fpsUpdate` (derived from ticks)

## Known phase-1 limitations (warn-and-continue, never silent)

- Transitions/animations via AnimeJS (optional peer `animejs`, lazy-loaded
  in the FTL chunk only). All 16 Blits easings map to identical L3
  cubic-bezier curves; `start/progress/end` callbacks, delay, cancel and
  router `end`-promises work. Without the peer, transitions apply instantly
  with a warning
- `rounded` / `border` / `shadow` / `shader` / custom `shaders[]` ignored
- Gradient color objects ignored (solid fallback: transparent)
- Native sprites (`image` / `map` / `frame`) ignored
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

## Roadmap (phase 2)

Shader bridge (rounded/border/shadow/custom), sprite textures, MSDF fonts,
animation engine over `signals.tick` + `addActiveCheck`, inspector metadata,
mouse picking via bounds walk, pixel-ratio support.
