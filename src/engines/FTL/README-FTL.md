# Blits + FTL

This branch uses **FTL only**. There is no L3 backend or L3 renderer dependency.
Use upstream Blits (`master`) as the L3 reference for cross-renderer comparisons.

## Setup

`npm install` installs Lightning FTL from the pinned GitHub `v0.15.1` release.
**Do not run `npm install ftl`: the npm package with that name is unrelated.**
AnimeJS is an optional peer for transitions (`npm install animejs`). It is also
installed for development. Without it, transitions apply their final values.

```js
await Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  renderMode: 'webgl', // or 'canvas'; this is not a backend selector
})
```

FTL dependencies initialize asynchronously. `Launch()` resolves after the
renderer is published and the application is constructed, not after all fonts,
images, or the first frame have finished loading. Await it to handle startup
errors. The old `renderer: 'ftl'` setting is unnecessary and warns; requesting
`renderer: 'l3'` throws rather than silently running a different backend.

For sibling development, an application can override its FTL dependency with
`"ftl": "file:../ftl"`. FTL package exports are used directly; no L3 aliases or
compatibility facade package is needed.

## Supported integration

- Position, size, percentages, z-index, rotation, mount, pivot, scale, alpha,
  visibility, layouts, components, router and focus.
- Solid string and numeric `0xRRGGBBAA` colors; gradient objects use the built-in
  gradient shaders, including four-corner gradients.
- Raster images, native sprite sheets, and `fit="contain"` / `fit="cover"`
  with optional crop positioning. Image/text mutations invalidate FTL state.
- Canvas text and configured MSDF font families. Canvas render mode uses canvas
  fonts; WebGL initializes the MSDF engine only when configured fonts need it.
  Font registration is lazy, matching current FTL's first-use loading.
- Built-in rounded, border, shadow, gradient and hole-punch effects on WebGL.
- Optional AnimeJS transitions driven by FTL ticks.
- `frameTick` hooks with `{ time, delta }`, idle/active hooks, derived FPS,
  and context loss/restoration events. The profiler receives frame timing.
- Runtime `canvasColor` and `fpsInterval` updates target FTL.
- `textureProcessingTimeLimit` maps to FTL's upload budget; `webWorkersLimit`
  defaults to at most two workers.
- `advanced` overrides FTL config fields (for example `maxTextureCount`,
  `maxPoolSize`, `handleLoopError`, `contextRestoreTimeout`). Stage dimensions
  remain controlled by `w`/`h`.
- `rendererPlatform` accepts an FTL platform object. `browserPlatform` is
  exported from `@lightningjs/blits/platforms`; L3 platform constructors are gone.

## Known gaps — not a full parity claim

- Text metrics, containment, line-height semantics and SSDF/rich text do not yet
  match every upstream L3 case. `rich` warns; text remains plain text.
- Draw ordering, image tinting, textured effects, moving/nested clipping and RTT
  sharing still require dedicated parity work. Similar shader names do not
  imply identical composition with image textures.
- `inViewport` currently approximates `inBounds`; FTL does not expose L3's three
  viewport/preload states. These are not exact viewport lifecycle semantics.
- Mouse picking, inspector, rounded descendant clipping, custom shader
  registration and post-creation reparenting are unsupported.
- Sprite `@error` is not wired by the sprite bridge yet. Ordinary image/font
  failures use the element failure signal.
- `pixelRatio`, `renderQuality`, `screenResolution`, `gpuMemory`, and `maxFPS`
  warn when explicitly supplied. The stage renders at authored dimensions and
  is fitted with CSS; this is not equivalent to L3 pixel-ratio rendering.
- Other renderer runtime settings warn rather than targeting an L3 singleton.
- Quit stops FTL, disposes facade subscriptions/timers and animation integration,
  but FTL still permits only one global stage per page. Relaunch needs a reload.

## Verification strategy

Retain shared Blits unit tests and FTL bridge tests here. Run matching Blits
fixtures against upstream Blits/L3 and this branch/FTL, with the same assets,
fonts, dimensions and capture points. Compare output to the L3 reference and
assert dimensions, events and lifecycle separately. Different backend-specific
snapshot baselines alone do not prove parity.

There is **not yet a cross-backend visual suite** in this refresh. Existing
mocked/unit tests cannot establish visual equivalence. Add native FTL regression
cases for engine bugs exposed by real Blits fixtures rather than building a
standalone L3 compatibility layer.
