# Blits dual-renderer (L3 + FTL) — TODO tracker

Branch: `ftl-dual-renderer`. Decisions locked: **build-time renderer flag,
phase-1 core-only parity, FTL as optional peer dep.**
Interface contract: `src/engines/common/nodeAdapter.js`.

## Done

- [x] Branch `ftl-dual-renderer` created off `master`.
- [x] `src/engines/common/nodeAdapter.js` — NodeAdapter interface
      (`getRoot/createNode/createTextNode/setProp/animate/on/off/destroy/
      getParent/getChildren/getId` + phase-2 `createShader/createTexture/
      loadFont` throwing `unsupported`), `assertNodeAdapter`, payload
      normalization notes.
- [x] `src/engines/L3/nodeAdapter.js` — 1:1 wrapper over `RendererMain`
      singleton (no behavior change; element.js not yet migrated).
- [x] `src/engines/FTL/launch.js` — Blits settings → FTL
      `main({platform, renderer, text, config})` mapping (dynamic `ftl/*`
      imports so L3 bundle/tests never touch FTL).
- [x] `src/engines/FTL/nodeAdapter.js` — skeleton (dirty discipline,
      text/image split, signal bridge, `animate`/shaders throw).
- [x] `src/engines/FTL/index.js` + export `FTL` from `src/engines/index.js`
      (`Element: null` placeholder until phase 0 element refactor).
- [x] Runtime engine selection: `Blits.Launch(App, target, { renderer:
      'l3'|'ftl' })` in `src/launch.js` (L3 path unchanged/sync; FTL path
      dynamic-imports engine, publishes facade via `onRenderer` before `App()`
      runs). `ftl` added as optional peer dep.
- [x] `src/engines/FTL/element.js` — core BlitsElement-over-FTL (props
      transformer, populate/set/destroy, layoutFn, instant-animate with
      start/end callbacks, node on/off shims for core lifecycle hooks).
- [x] Renderer facade in FTL launch (idle/active/frameTick/fpsUpdate canvas);
      `stage` omitted (mouse picking phase 2, guarded by existing null check).
- [x] Example app wired on branch `ftl-enabled` (`file:../blits`,
      `file:../ftl`, `?renderer=ftl` toggle, vite `ftl/*` alias, README).
- [x] Verified: blits `test:run` 1370/1370; example app `vite build` clean;
      headless-Chrome smoke on `?renderer=ftl` — zero console/page errors,
      Portal renders (layout/colors/images/canvas text), keyboard focus +
      route navigation work.
- [x] AnimeJS bridge (Blits-owned, optional peer `animejs`, FTL chunk only):
      `FTL/tween.js` (L3-exact cubic-bezier easing map, controller emulation,
      engine injection, running-tween counter for `addActiveCheck`),
      loop integration in `FTL/launch.js` (manual engine mode + tick drive),
      `nodeAdapter.animate` + `_executeAnimation` rewire with instant fallback.
      `FTL/tween.test.js` (40 asserts). Verified on Transitions page:
      interpolation frames differ, zero errors, start/end callbacks fire.
- [x] `animejs@^4.0.0` added to blits `devDependencies` (resolves the optional
      peer from Blits' real path at build/test time; not shipped to consumers).
- [x] Shader bridge, built-ins only (Blits-owned, FTL chunk only):
      `FTL/shaders.js` (L3-parity combo matrix, border/shadow/rounded/gradient
      translators, `shader={type}` dispatch, injected modules/stage,
      z-bucket re-listing on null<->set), `_syncElementShader` rewire with
      reactive live updates, `additionalShaders` boot wiring.
      `FTL/shaders.test.js` (56 asserts). Verified on Shaders/Gradients pages
      + Portal: zero errors, rounded/border/shadow combos, live reactive
      updates, pixel-verified gradient axes.
- [x] `ftl` package: `./stage` export subpath (bridge needs the stage for
      re-listing; keeps Blits imports on declared exports).
- [x] Bucket-order cover-up fix (fullscreen gradient Portal root painted
      over all text/images): FTL kind-split — background-kind shader quads
      (rounded/combos/gradients/holepunch) paint before IMAGE/TEXT,
      overlay kinds (border/shadow/grayscale) keep the late position;
      `recycleElement` resets `_bucketRenderType`; Blits excludes text
      nodes from gradient instances (effects don't sample glyphs).
      Verified: Portal pixel-correct (logo/text/white focus card), focus
      navigation repaints, zero errors.

## Findings (implementers read this)

- FTL texture loading deadlock: textures only `load()` after the element is
  renderable (`w>0 && h>0`) and flips out-of-bounds→in-bounds. Unmeasured
  Blits text/image nodes need a 1x1 provisional size
  (`ensureProvisionalSize` in FTL/nodeAdapter.js, mirrors L3's 1px text
  nodes); real dims replace it via autoSize/set + parent re-layout on loaded.
- `webglRenderer(canvas, shaders)` requires `additionalShaders: []`
  explicitly (default param only applies when the arg is undefined).
- Dynamic `import('ftl/...')` specifiers must stay static strings (no
  `@vite-ignore`, no variable) or the browser build emits bare specifiers
  that fail at runtime. Dev server additionally needs the `ftl/*` alias in
  the app's vite config (optional-peer-dep externalization + export remaps
  like `ftl/shaders` → `src/renderer/webgl/shader/index.js`).
- MSDF/SDF font entries with a loadable `file` (ttf/otf/woff) can feed the
  canvas text engine directly — big typography/layout win for phase 1.
- `npm install` with `file:` deps required deleting the stale
  `package-lock.json` first (npm 11 arborist crash otherwise).

## Next — Phase 0: extract interface (L3, no behavior change)

- [ ] Migrate `src/engines/L3/element.js` call-by-call to `L3/nodeAdapter.js`:
      `createNode/createTextNode` (:653-655), `set` (:804-839, `node[k] =`),
      `animate` (:855-953, `node.animate`), `destroy` (:1012),
      `parent/children/nodeId` getters (:1015-1039), `loaded/failed` subs
      (:665-686). Keep `propsTransformer` in element.js for now.
- [ ] Decouple `lib/shaders/shaders.js`, `L3/spriteTexture.js`,
      `L3/fontLoader.js`, `L3/shaderLoader.js` from `import { renderer }` —
      inject adapter/renderer as arg.
- [ ] Add `assertNodeAdapter(L3adapter)` boot check + contract test
      (extend `testing/renderComponent.js` mock).
- [ ] Run `npm run test:run` + lint; confirm zero bundle/behavior diff.

## Next — Phase 1: FTL engine (core-only)

- [ ] `src/engines/FTL/element.js` (real BlitsElement-over-FTL):
      `populate/set/destroy` via FTL nodeAdapter; `FTL/props.js` deltas
      (color number→`[r,g,b,a]`, `show→visible`, default `color:null`,
      `%`→px pre-resolution, `clip`, `mount/pivot/scaleX/Y`,
      `rotation°→rad`); keep shared `layoutFn` + `dirtyBranch()` hookup.
- [ ] `src/engines/FTL/events.js` — normalize `loaded {w,h}` / error payloads.
- [ ] `src/engines/FTL/animation.js` — stubbed warn-and-apply-end-value.
- [ ] Build-time flag: `vite/index.js` `renderer: 'l3'|'ftl'` option →
      `define __BLITS_RENDERER__` → conditional `src/engines/index.js` /
      `src/engine.js` so the unselected renderer tree-shakes out.
- [ ] `package.json`: `ftl` → `peerDependencies` + `peerDependenciesMeta.ftl.optional=true`;
      document install (`npm i ftl`) for FTL builds.
- [ ] Tests: `src/engines/FTL/*.test.js` (prop table, dirty-called, text/image
      creation, unsupported-throws); dual example-app builds (l3 vs ftl).

## Spike list (deferred, as agreed)

- [ ] FTL `createText` exact prop contract (font/size/align/contain/maxWidth,
      `autoSize`), canvas-text metrics vs L3 SDF.
- [ ] FTL `createImage`/texture `loaded/released` signals + `autoSize` for
      `src`/`@loaded/@error` parity.
- [ ] FTL canvas handle exposure for `target.appendChild` + `getNodeFromPosition`
      / mouse-pick story.
- [ ] Color converter (`colors.normalize` number → FTL `[0-1] rgba`, gradients?).
- [ ] `%` resolution + flex `layoutFn` over FTL `children`/`dirtyBranch`.
- [ ] Animation bridge design (`signals.tick` + `addActiveCheck` + AnimeJS) for phase 2.

## Phase 2+ (full parity, out of scope now)

- Shader bridge (rounded/border/shadow/custom), sprites/subtextures,
  SDF/MSDF fonts + `loadFont`, animation controller, inspector `data` sync,
  RTT, `inBounds/outOfBounds/inViewport` + FPS/idle/active event parity.

## Key files

- Interface: `src/engines/common/nodeAdapter.js`
- L3: `src/engines/L3/element.js`, `src/engines/L3/launch.js`,
  `src/engines/L3/nodeAdapter.js`
- FTL: `src/engines/FTL/{index,launch,nodeAdapter}.js`
  (element/props/events/animation TBD)
- Selection: `src/launch.js:144-146`, `src/engine.js`, `src/engines/index.js`,
  `vite/index.js`
