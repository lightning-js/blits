# Blits App Framework - Agent Development Instructions

**Target**: Fast, lightweight app development framework on top of the Lightning 3 renderer (with opt-in FTL engine) for constrained TV / set-top-box hardware

## Core Philosophy

**Developer experience + performance**: Blits aims to be fun and easy (readable XML-style templates, declarative reactivity) while staying lightweight and fast on low-powered devices. Prefer the declarative Blits API over manual renderer calls. When in doubt, optimize for startup time, memory footprint, and steady frame rate — not micro-benchmarks.

### Architecture Principles

- **No classes for components ever** - Components are factories: `Blits.Component(name, config)` returns a factory function, instantiated via `Object.create(Base)` internally
- **Declarative templates, explicit reactivity** - Describe UI in `template`; mark reactive bindings explicitly with `:`; keep logic in `state` / `props` / `computed` / `methods` / `watch`
- **Lean runtime on constrained hardware** - Avoid per-frame allocation, heavy `frameTick` work, and unbounded lists; window long lists with `:range`
- **Validate at public boundaries with `Log`** - Use `Log.warn` / `Log.error` at `Component()`, `Application()`, `Launch()`, router navigation, and plugin registration. Never validate inside render effects or per-frame callbacks
- **Early returns** - Most common paths first, error / end-of-life checks on top

## Target: Constrained TV / STB Hardware

Blits apps typically run on low-powered TV SoCs with limited CPU, GPU memory, and network bandwidth. Every framework decision must be evaluated against this baseline. Desktop browsers are a bonus, not the target.

### Rules for fast apps on slow devices

- **Startup is a feature** - Lazy-load routes (`component: () => import('./pages/Home.js')`), defer below-the-fold work, keep `public/` assets small. External dependencies cost parse + memory: justify each one
- **Window long lists** - Rails with 100+ items must use `:for` with `:key` plus `:range` (see Performance Rules). Never render hundreds of components unconditionally
- **Images and textures cost memory** - Only rendered items load assets. Use `:range` so off-screen items neither exist nor fetch. Respect `gpuMemory` / `textureProcessingTimeLimit` settings instead of working around them
- **Keep per-frame work near zero** - No object creation, no deep state walks, no layout thrash in `frameTick`, reactive effects, or `watch` handlers that fire at 60fps
- **Prefer GPU-cheap animation** - Use `.transition` bindings (`:x.transition`, `:alpha.transition`) and router transitions instead of JS-driven per-frame interpolation. Spread list growth over ticks with `$setTimeout`

## Performance Rules (CRITICAL)

### 1. Template Binding Tiers

```xml
<!-- ✅ DO: static for things that never change -->
<Element w="300" h="200" color="#0891b2" />

<!-- ✅ DO: dynamic ($...) set once from initial state -->
<Element w="$width" h="$height" color="$color" />

<!-- ✅ DO: reactive (:...) only where change must re-render -->
<Element :w="$changingWidth" :alpha.transition="$focused === $index ? 1 : 0.6" />
```

```javascript
// ❌ NEVER: make everything reactive "just in case"
// :x, :y, :w, :h, :color on dozens of nodes that never change // NO - subscribes effects for nothing
```

Rules:

- `attr="literal"` — static, baked into `elementConfigs` once (cheapest)
- `attr="$var"` — dynamic, set once from initial state (no subscription)
- `:attr="$var + expr"` — reactive, subscribes an `effect` that re-runs on every change (most expensive; use deliberately)
- Interpolation (`:x="0 - $focused * 300"`, ternaries, `Math.floor`) is allowed but keep it simple; move complex logic to a `computed` or `method`

### 2. Loops: Always `:key`, Window with `:range`

```xml
<!-- ✅ DO: keyed loop with a range window -->
<Tile
  :for="(item, index) in $items"
  :range="{from: 0, to: $range + 7}"
  :key="$item.id"
  :x="$index * 320"
/>
```

```xml
<!-- ❌ NEVER: unkeyed loop over a large array -->
<Tile :for="item in $items" /> <!-- NO - full recreate on every change -->
```

Rules:

- Always pass `:key="$item.id"` (stable id). Without it the whole list is destroyed and recreated on change
- Never put `:for` on the template root node (parser rejects it)
- For rails / grids: use `:range="{from, to}"` with a 5–10 item lookahead buffer (see `docs/performance/lazy-loading.md`)
- Grow-only lazy load: `from: 0, to: $range + 7`, bump `$range` on navigation, never decrement when scrolling back, and push growth to the next tick so scroll stays smooth:

```javascript
// ✅ DO: spread list growth over ticks
input: {
  right() {
    this.focused = Math.min(this.focused + 1, this.items.length)
    this.$setTimeout(() => (this.range = this.focused))
  },
  left() {
    this.focused = Math.max(this.focused - 1, 0)
    // do NOT decrement range when scrolling back — keep components alive
  },
}
```

### 3. Comparison Operations

```javascript
// ✅ DO: Direct comparisons
if (value === null) return
if (type === 2) continue
if (buffer.length === 0) return
if (Array.isArray(props) === true) { /* ... */ }

// ❌ NEVER: Truthy/falsy checks
if (value) return      // NO
if (!items.length)     // NO
if (buffer)           // NO
```

### 4. State Access & Computed Over Template Logic

```javascript
// ✅ DO: Extract frequently accessed state, expose derivations as computed
computed: {
  offset() {
    return this.index * 100
  },
}

// ✅ DO: Cache in method bodies
const focused = this.focused
const items = this.items

// ❌ AVOID: Deep chains and function calls in hot reactive bindings
// :x="$a.b.c.d + computeExpensive($x)" // NO - move to computed
```

### 5. Early Returns & Flat Code

```javascript
// ✅ DO: Error / end-of-life checks first, early returns
function setFocusTarget(component) {
  if (component === undefined) return
  if (component.eol === true) return
  if (component === focusedComponent) return

  // Main logic here - flat, no nesting
  const parent = component[symbols.parent]
  // ...
}

// ❌ NEVER: Deep nesting (max 3 levels)
if (condition) {
  if (other) {
    if (another) {
      if (deep) {
        // NO - too deep
      }
    }
  }
}
```

### 6. Renderer Settings That Affect Speed

Map app needs to `Blits.Launch(App, target, settings)` keys (see `src/launch.js`):

- `viewportMargin` → bounds margin driving `attach` / `detach` / `enter` / `exit` — larger keeps more alive (smoother scroll, more memory)
- `fpsInterval` → `fpsUpdate` cadence (`frameTick` fires every frame, `fpsUpdate` on interval — never do heavy work in `frameTick`)
- `gpuMemory` (`{max, target, cleanupInterval}`) + `textureProcessingTimeLimit` — respect them; don't defeat texture cleanup
- `renderQuality` / `pixelRatio` / `screenResolution` / `maxFPS` / `canvasColor` / `inspector` — only set what the app needs

## Data Structures & Reactivity

### State / Props / Computed / Watch

```javascript
// ✅ DO: state as a regular function returning an object (this-bound)
export default Blits.Component('Rail', {
  state() {
    return { focused: 0, range: 0, items: [] }
  },
  props: { color: 'red', height: undefined }, // object notation; array notation is deprecated
  computed: {
    // ✅ DO: getter-only, no side effects
    offset() {
      return this.index * 100
    },
  },
  watch: {
    alpha(v, old) {
      /* react to change */
    },
    'size.h'(h) {
      /* dot-notation deep watch */
    },
  },
})

// ❌ NEVER: arrow function for state/methods/computed/watch/input (breaks `this`)
// state: () => ({ focused: 0 }) // NO

// ❌ NEVER: mutate props inside a component (setter warns)
// this.color = 'blue' // NO — props are owned by the parent / router
```

Rules:

- Access via `this.foo` in JS, `$foo` in template (`$$` escapes to `component.$`). Never use `state.` prefix in JS
- Never reuse a name across `state` / `prop` / `method` / `computed` — setup logs errors (`src/component/setup/state.js`, `src/component/setup/computed.js`)
- Never define your own `$hasFocus` / `$isHovered` state keys — they are built-in and reactive in templates (`$$hasFocus`, `$$isHovered`)
- Route `params` / `data` arrive as props — the component must declare them to receive them
- `$trigger(key)` forces a watcher to fire; use sparingly

### Reactivity Internals (for contributors)

- `reactive(target, mode)` defaults to `Proxy`, falls back to `defineProperty` (`src/lib/reactivity/reactive.js`). Array mutations (`push/pop/splice/...`) trigger parent + key
- `effect(fn, key)` tracks dependencies; template `:` bindings compile to effects (`src/lib/codegenerator/generator.js`). Keep effects small and side-effect free
- `memo` helper exists for derived values — prefer `computed` at component level

## Code Patterns

### Component Factory Pattern

```javascript
// ✅ DO: Blits.Component factory with config object
import Menu from './components/Menu.js'

export default Blits.Component('MyComponent', {
  components: { Menu },
  template: `
    <Element>
      <Menu ref="menu" />
      <Element :x="$offset" w="100" h="100" color="$color" />
    </Element>
  `,
  state() {
    return { offset: 0, color: '#0891b2' }
  },
  hooks: {
    ready() {
      this.$select('menu').$focus()
    },
    destroy() {
      this.$clearTimeout(this._timer)
    },
  },
})
```

Rules:

- Structure is `Holder > Wrapper > []Elements` (`src/component.js`). Internals live behind `symbols.*` — never use string keys for framework internals
- Setup order is fixed: hooks → props → methods → state → computed → watch → routes → input (`src/component/setup/index.js`). Don't depend on cross-phase ordering beyond this
- `components: { Menu, MyButton: Button }` registers tags (`<Menu />`, `<MyButton />`). `<Component is="$type" />` is not reactive after init
- `ref="name"` + `this.$select('name')` for imperative access; `:ref` for dynamic refs; `:show="$active"` to toggle visibility
- One file per component, filename capitalized matching the component (`src/components/MenuItem.js`); pages in `src/pages/` (`docs/getting_started/file_structure.md`)

### Template Parser + Codegen Pattern

- Parser (`src/lib/templateparser/parser.js`) is a hand cursor parser: single root required, no `:for` on root, `name="value"` attributes only, dot-attrs (`x.transition`) become `{transition: ...}`, colors normalized, comments/newlines stripped
- Codegen (`src/lib/codegenerator/generator.js`) emits `new Function('parent,component,context,components,effect,getRaw,Log', renderCode)` once per type plus an `effects` function for `:` bindings. Static bindings bake into `elementConfigs`; `{{}}` becomes string concat; `$foo → component.foo`; `%` dims resolve against parent; `w/h` (never `width/height`)
- Consequence: template syntax errors surface at parse/codegen time — keep templates simple and let the parser do the work instead of building elements imperatively

### Router Pattern

```javascript
// ✅ DO: declarative routes with lazy pages, hooks, and transitions
export default Blits.Component('App', {
  template: `<Element><RouterView /></Element>`,
  routes: [
    {
      path: '/',
      component: () => import('./pages/Home.js'), // hoist shared loaders — inline duplicates break reuseComponent
      options: { keepAlive: true, inHistory: true, passFocus: true },
      transition: { in: { prop: 'alpha', value: 1, duration: 300 } },
      announce: 'Home page',
    },
  ],
  hooks: {
    init() {
      this.$router.to('/')
    },
  },
})
```

Rules (`src/router/router.js`, `src/component/base/router.js`):

- Navigate via `this.$router.to(path, data, opts)` / `this.$router.back()`; read `this.$router.currentRoute`, `navigating`, `state.path/params/hash/data`. `$$router.state.path` is reactive in templates
- `before` returning `false` cancels, a `string` redirects, `object.path` redirects. `keepAlive` caches only on forward `inHistory` navigation; otherwise the old view is destroyed
- `keepAlive` and `reuseComponent` are mutually exclusive. Hoist `() => import()` loaders shared across routes
- Named views: `<RouterView name="modal" />` + `this.$router.get('modal').to(...)`; resolver prefers single/default view and warns on miss

### Focus & Input Pattern

```javascript
// ✅ DO: local input handlers, explicit focus movement
export default Blits.Component('Menu', {
  template: `<Element :x="0 - $focused * 300"><!-- items --></Element>`,
  state() {
    return { focused: 0 }
  },
  input: {
    right() {
      this.focused += 1
    },
    left() {
      this.focused -= 1
    },
    enter() {
      this.$select('detail').$focus()
    },
    any(e) {
      /* fallback for unhandled keys */
    },
  },
})
```

Rules (`src/focus/focus.js`, `src/application.js`, `docs/components/user_input.md`):

- Single focused component + focus chain; `set()` skips `eol` / duplicates; leaf focus is async (honors `holdTimeout`)
- Input bubbles to the nearest ancestor with a matching handler (`input.any` catches all). Control bubbling explicitly: `$parent.$focus(e)` moves focus and bubbles, `$parent.$focus()` moves only, `$parent.$input(e)` handles without moving
- `keyup` handler = return a function from the input handler (`return () => {...}` or `return this.onKeyUp`)
- Custom keys via `Blits.Launch(App, el, { keymap: { 83: 'search' } })`; defaults live in `src/constants.js` (arrows, enter, space, back, escape). `intercept(e)` on App only
- Mouse is opt-in (`enableMouse: true` → hover + click-to-focus + click as Enter). Don't assume pointer input exists

### Engine Abstraction Pattern

```javascript
// ✅ DO: go through stage.element / renderer singletons, never import L3/FTL directly in components
import { stage, renderer } from './launch.js'
```

Rules (`src/engine.js`, `src/engines/`, `src/launch.js`):

- Both engines expose `{ Element, Launch }` so `stage.element = engine.Element; renderer = engine.Launch(...)`. `renderer: 'l3'` (default, sync) vs `renderer: 'ftl'` (async, phase-1 core-only — ignores `renderQuality` / `pixelRatio` / `gpuMemory` / `advanced`)
- Unknown engine names fall back to `l3` with a warning. New engine work belongs under `src/engines/<Name>/{element,launch,nodeAdapter}.js` plus shared code in `src/engines/common/`
- Codegen imports `elementAttributes` from the L3 element for the prop-vs-attr split — keep that contract when touching element props

### Plugin / Settings / Logging Pattern

```javascript
// ✅ DO: framework logging + settings + cleanup discipline
import { Log } from './lib/log.js'
import Settings from './settings.js'

const level = Settings.get('debugLevel', 0)

export default Blits.Component('Player', {
  hooks: {
    ready() {
      this._timer = this.$setTimeout(() => this.$emit('loaded'), 500)
      this.$listen('volume', this.onVolume)
    },
    destroy() {
      this.$clearTimeout(this._timer)
      this.$unlisten('volume', this.onVolume)
    },
  },
  methods: {
    onVolume(v) {
      Log.info('volume changed', v)
    },
  },
})
```

Rules (`src/lib/log.js`, `src/settings.js`, `src/plugin.js`, `src/component/base/`):

- Use `Log.info/warn/error/debug` (gated by `Settings.debugLevel`), never raw `console.*` in framework code
- `Settings.get(key, default)` / `Settings.set(obj)`; settings flow from `Launch()` — don't read DOM / env directly for configured values
- Plugins: `registerPlugin(fn, name, opts)` → `this.$name` on every component; built-ins in `src/plugins/`. Keep plugins side-effect free until installed
- Cleanup is mandatory: `destroy()` clears timeouts/intervals/debounces/listeners/renderer events/children. Always use `$setTimeout/$setInterval/$debounce/$clear*` and `$emit/$listen/$unlisten` so cleanup is automatic

## Logging & Validation (Blits Equivalent of DEV Guards)

Blits ships user-facing warnings via `Log` (controlled by `debugLevel` + vite `injectDevConfig`), not a compile-time `DEV` strip. Follow the same spirit: loud at the boundary, silent in the hot path.

```javascript
// ✅ DO: validate once at public API boundaries
import { Log } from './lib/log.js'

const createRoute = (def) => {
  if (def === undefined || def === null) {
    Log.error('[Blits] navigate: route definition is required')
    return
  }
  if (typeof def.path !== 'string') {
    Log.error('[Blits] navigate: route path must be a string')
    return
  }
  // ... production code follows unchanged
}
```

### Rules

1. **Only validate at public API boundaries** — `Component()`, `Application()`, `Launch()`, `navigate()` / `$router.to()`, `registerPlugin()`, template parse/codegen entry. Never inside effects, `frameTick`, or per-node updates
2. **Use `Log.warn` for recoverable misuse, `Log.error` for contract violations** — e.g. props mutation warns (`src/component/setup/props.js`), name collisions error (`src/component/setup/state.js`, `src/component/setup/computed.js`), deprecated array props warn once
3. **Use explicit comparisons** — `typeof x !== 'function'`, `x === null`, `Array.isArray(x) === true`. No truthy/falsy checks, consistent with the rest of the codebase
4. **Never validate deeper than the top-level call** — check the argument exists and has the right shape. Don't recursively walk templates, routes, or state trees on every call

### What NOT to do

```javascript
// ❌ NEVER: logging / validation in hot paths
const renderEffect = () => {
  Log.info('effect ran') // NO — fires on every state change
}

// ❌ NEVER: raw console in framework code
console.warn('not a function') // NO — use Log (fixes like src/component/setup/watch.js input validation should use Log)

// ❌ NEVER: deep validation of nested structures per call
for (const key in template) {
  /* NO — top-level only */
}
```

## Function Guidelines

### Function Signature Style

```javascript
// ✅ DO: Arrow functions for callbacks and internal helpers
const processElements = (elements) => {
  // ...
}

const normalizeProps = (props) => {
  // ...
}

// ✅ DO: Regular functions for anything that needs component `this`
export default Blits.Component('Rail', {
  state() {
    return { focused: 0 }
  },
  methods: {
    next() {
      this.focused += 1
    },
  },
  input: {
    right() {
      this.focused += 1
    },
  },
})
```

### JSDoc Type Annotations

**Do not use inline `/** @type {Type} */` casts** in expressions (e.g. `const x = /** @type {Foo} */ (bar)`).

**Do not use the `any` type in JSDoc.**

Standard `@param {Type}`, `@returns {Type}`, `@this {Type}`, and `@typedef` blocks are encouraged — Blits already documents `BlitsComponent`, `BlitsElement`, `BlitsSettings`, and `Route` this way.

```javascript
/**
 * @typedef {Object} RailState
 * @property {number} focused - Focused item index
 * @property {number} range - Rendered range cursor
 */

/**
 * Clamp the focused index.
 * @param {number} next - Requested index
 * @returns {number} The clamped index
 */
const clampFocused = (next) => {
  // ...
}
```

## What to NEVER Do

1. **Never use classes for components** - Use `Blits.Component(name, config)` factories
2. **Never use arrow functions for `state` / `methods` / `computed` / `watch` / `input` / `hooks`** - They need component `this`
3. **Never mutate `props` directly** - Props are owned by the parent / router
4. **Never reuse a name across `state` / `prop` / `method` / `computed`** - Setup logs errors and behavior is undefined
5. **Never use `:for` without `:key`** - Use a stable id (`:key="$item.id"`); never index as key for mutable lists
6. **Never render unbounded lists** - Window with `:range` (+ 5–10 lookahead) and grow on next tick via `$setTimeout`
7. **Never do heavy work in `frameTick`, effects, or watchers** - No allocation, no deep walks, no logging per frame
8. **Never use truthy/falsy checks** - Use explicit comparisons (`=== null`, `!== undefined`, `Array.isArray(x) === true`)
9. **Never nest more than 3 levels deep** - Use early returns (`undefined` / `eol` / duplicate-focus checks first)
10. **Never use raw `console.*` in framework code** - Use `Log.info/warn/error/debug`
11. **Never use string keys for framework internals** - Use `symbols.*` (`symbols.state`, `symbols.props`, `symbols.routes`, ...)
12. **Never use `width` / `height`** - Element dims are `w` / `h`
13. **Never leak timers / listeners / renderer events** - Use `$setTimeout/$setInterval/$debounce/$emit/$listen` so `destroy()` cleans up
14. **Never use inline JSDoc type casts** - Write `@param` without `{Type}` inline expressions
15. **Never use the `any` type in JSDoc** - Be specific or omit the type

## Code Review Checklist

Before submitting code, verify:

- [ ] Components use `Blits.Component` / `Blits.Application` factories (no classes)
- [ ] `state` / `methods` / `computed` / `watch` / `input` / `hooks` are regular functions (correct `this`)
- [ ] No name collisions across `state` / `props` / `methods` / `computed`
- [ ] Props are never mutated; route params are declared as props before use
- [ ] Template bindings use the cheapest tier (`static` > `$` once > `:` reactive); complex expressions moved to `computed` / `methods`
- [ ] Every `:for` has a stable `:key`; large lists add `:range` with lookahead and next-tick growth
- [ ] No `:for` on template root; custom tags registered in `components`; `ref` + `$select` used for imperative access
- [ ] Focus moves explicitly (`$focus` / `$input` / `$router`); input bubbling is intentional (`any` only as fallback); `keyup` uses returned callbacks
- [ ] Router changes hoist shared `() => import()` loaders; `keepAlive` and `reuseComponent` not combined; `passFocus` / `inHistory` set deliberately
- [ ] No heavy work, allocation, or logging in `frameTick` / effects / watchers; transitions use `.transition` bindings
- [ ] All comparisons are explicit (`===`, `!==`, `Array.isArray(x) === true`)
- [ ] Early returns implemented; no nesting beyond 3 levels; `eol` / `undefined` guards on top
- [ ] Framework internals use `symbols.*`, `Settings.get/set`, and `Log.*` (no `console`, no direct env reads)
- [ ] Timers / listeners / renderer subscriptions use `$`-helpers and are released in `destroy`
- [ ] Element dims are `w` / `h`; colors are CSS strings; `%` dims used only where parent-relative sizing is intended
- [ ] No inline JSDoc casts; no `any` in JSDoc; new public APIs carry `@param` / `@returns` / `@typedef`
- [ ] Tests added/updated (`tape` + `global-jsdom`; `renderComponent` fixture with `focus()` before `input()` and `destroy()` after); `npm run test:run` and `npm run lint` pass

## Common Patterns to Follow

Look at these files for reference patterns:

- [`src/component.js`](src/component.js) - Component factory + Holder/Wrapper/Elements assembly
- [`src/component/base/index.js`](src/component/base/index.js) - Base composition (`methods`, `router`, `events`, `timeouts`, `announcer`, `$reactive`)
- [`src/component/setup/index.js`](src/component/setup/index.js) - Setup order (hooks → props → methods → state → computed → watch → routes → input)
- [`src/lib/templateparser/parser.js`](src/lib/templateparser/parser.js) - Template parsing constraints
- [`src/lib/codegenerator/generator.js`](src/lib/codegenerator/generator.js) - Static vs reactive codegen
- [`src/lib/reactivity/reactive.js`](src/lib/reactivity/reactive.js) + [`src/lib/reactivity/effect.js`](src/lib/reactivity/effect.js) - Proxy reactivity + effects
- [`src/lib/lifecycle.js`](src/lib/lifecycle.js) - Lifecycle states (`init`, `ready`, `focus`, `unfocus`, `destroy`, `attach`/`detach`, `enter`/`exit`)
- [`src/router/router.js`](src/router/router.js) - Navigation flow, transitions, `keepAlive` cache
- [`src/focus/focus.js`](src/focus/focus.js) - Focus chain + input bubbling
- [`src/application.js`](src/application.js) - App bootstrap, keymap, hold, mouse support
- [`src/engine.js`](src/engine.js) + [`src/engines/`](src/engines/) - L3 / FTL engine abstraction
- [`src/launch.js`](src/launch.js) - `Launch()` settings and renderer/stage singletons
- [`src/settings.js`](src/settings.js) + [`src/lib/log.js`](src/lib/log.js) - Settings + gated logging
- [`src/plugin.js`](src/plugin.js) + [`src/plugins/`](src/plugins/) - Plugin registration
- [`vite/index.js`](vite/index.js) - Vite plugins (`preCompiler`, `reactivityGuard`, `blitsFileConverter`)
- [`src/testing/`](src/testing/) - `renderComponent` test harness

App-side guidance lives in `docs/`: template syntax (`docs/essentials/template_syntax.md`), element attributes (`docs/essentials/element_attributes.md`), `for`-loops (`docs/built-in/for-loop.md`), lazy loading (`docs/performance/lazy-loading.md`), router (`docs/router/`), user input (`docs/components/user_input.md`), and testing (`docs/testing/test-harness.md`).

Remember: Blits is an app framework for constrained TV hardware. Keep the authoring experience delightful and the runtime fast — declarative templates, explicit reactivity, windowed lists, cheap frames, and clean teardown.
