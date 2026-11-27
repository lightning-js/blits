# Blits App Framework - Agent Development Instructions

**Target**: Contributors modifying the Blits framework itself (`src/`, `vite/`, `src/engines/`). Blits is a fast, lightweight app framework on the Lightning 3 renderer for constrained TV / set-top-box hardware.

> App-developer guidance (how to *use* Blits: template syntax, `:for`/`:key`/`:range`, input bubbling, router recipes) lives in `docs/` — see the primer at the bottom. This file is about how to *build* Blits.

## Core Philosophy

**Lean runtime, explicit contracts, loud boundaries**: the framework must stay small and fast on low-powered devices while giving app developers readable errors. Prefer declarative compilation (template → generated code) over imperative runtime work. When in doubt, do work once at setup/parse time, never per frame.

### Architecture Principles

- **No classes for framework objects ever** - Use factory functions, plain objects, `Object.create()` and `Object.defineProperties()`. The only `class` keywords in `src/` are test/platform shims — never copy them into framework code
- **Factories close over config, instances hang off prototypes** - `Blits.Component(name, config)` returns a factory; instantiation is `component.call(Object.create(base), ...)` (`src/component.js:207,444,498,505`)
- **Component `this` is a contract** - User callbacks (`state`, `methods`, `computed`, `watch`, `input`, `hooks`) run with component `this` via explicit `.apply(this)` / `.call(this, ...)`; framework helpers are arrows that never touch `this`
- **Internals hide behind `symbols.*`** - Never string keys for framework slots; user `state`/`props`/`methods`/`computed` share one namespace, so internals must be collision-proof
- **Validate at public boundaries with `Log`, throw only for missing contracts** - Setup, `Launch()`, navigation entry, plugin registration. Never validate inside effects, `frameTick` paths, or per-node updates
- **Early returns** - Most common paths first, `undefined` / `null` / end-of-life checks on top, max 3 nesting levels

## Know the Machine: Constrained TV / STB Hardware

Blits apps run on low-powered TV SoCs with limited CPU, GPU memory, and network bandwidth. Desktop browsers are a bonus, not the target. Framework consequences:

- **Setup-time work is cheap, per-frame work is not** - Parse, codegen, and component setup run once; `effect` bodies, `trigger` paths, focus changes, and `frameTick` handlers run constantly. Budget accordingly
- **Memory pressure is real** - Prefer shared prototypes and pre-allocated structures over per-instance closures; always wire teardown (`destroy()` clears timers/listeners/renderer events/children)
- **Startup is a feature** - Keep the runtime import graph lean; justify every dependency (framework `dependencies` are `@lightningjs/renderer` + `magic-string` only)

## How Blits Is Built (Read This First)

```
template (XML string)
  → src/lib/templateparser/parser.js        (XML → AST)
  → src/lib/codegenerator/generator.js      (AST → new Function render + effects)
  → src/component.js                        (JIT once per type; render.apply(stage, ...); effect(eff) per :binding)
  → src/engines/L3/element.js               (stage.element: populate/set/animate real nodes)

config object
  → src/component/setup/index.js            (identifier → hooks → props → methods → state → computed → watch → router → input)
  → src/component/base/index.js             (Base = defineProperties({launched:false}, {methods, scheduling, shared, utils}))

state/props → src/lib/reactivity/reactive.js (Proxy, defineProperty fallback)
:bindings   → src/lib/reactivity/effect.js    (effect/track/trigger, synchronous)
input       → src/focus/focus.js              (single focus chain + bubbling)
routes      → src/router/router.js            (navigate → hooks → transitions → view swap)
bootstrap   → src/launch.js + src/engine.js + src/engines/*  ({Element, Launch} facade)
build       → vite/index.js                   (reactivityGuard → preCompiler AOT → msdfGenerator)
```

AOT reuses the same pipeline: `src/lib/precompiler/precompiler.js` runs `parser` + `generator` at build time and inlines `code: {render, effects, context}` so runtime skips JIT (`src/component.js:498-502`).

## Performance Rules (CRITICAL)

These govern framework code you write, not app templates. Every rule below is quoted from a hot path.

### 1. Comparison Operations

```javascript
// ✅ DO: Direct comparisons (src/focus/focus.js:44, src/component.js:446)
if (component === undefined || isInAliveComponentTree(component) === false) return
if (component === focusedComponent) return
if (Base[symbols['launched']] === false) { /* ... */ }
if (Array.isArray(props) === true) { /* ... */ } // src/component/setup/props.js:43

// ❌ NEVER: Truthy/falsy checks
if (value) return      // NO
if (!items.length)     // NO
if (buffer)           // NO
```

`indexOf(...) > -1` (not `.includes()`) in hot paths — `src/focus/focus.js:64`, `src/component/setup/state.js:31`, `src/lib/lifecycle.js:78`, `src/lib/reactivity/reactive.js:68`. `.includes()` appears only in cold code (parser, tests).

### 2. Loops: Cached `for`, `while` for Walks, `forEach` Only at Setup

```javascript
// ✅ DO: indexed for with cached length (src/component.js:379, src/lib/reactivity/effect.js:35)
for (let i = 0; i < effects.length; i++) { /* ... */ }
const propLength = props.length
for (let i = 0; i < propLength; i++) { /* ... */ }

// ✅ DO: while for chain/pointer walks (src/focus/focus.js:62, src/focus/helpers.js:43)
while (i--) {
  if (newFocusChain.indexOf(focusChain[i]) > -1) break
  focusChain[i][symbols.lifecycle].state = 'unfocus'
}
while (current !== undefined && current !== null) { /* ... */ }

// ✅ DO: for...in for dynamic user tables (src/component/setup/watch.js:24)
for (let watch in watchers) { /* ... */ }

// ❌ NEVER: forEach/map in per-frame or reactive paths
// effects.forEach(run) // NO — use indexed for (cf. src/lib/reactivity/effect.js:78-90)
```

`forEach` is acceptable at setup time only (`src/component/setup/input.js:24`, `src/settings.js:31`).

### 3. Keep Hot Paths Allocation-Free and Log-Free

The reactivity core is synchronous with no scheduler — every allocation and branch runs per state change (`src/lib/reactivity/effect.js:78-90`, `src/lib/reactivity/reactive.js:68-78,111-140`):

```javascript
// ✅ DO: guard-clause style from the actual trigger path
if (paused === true) return // src/lib/reactivity/effect.js:79
if (arrayPatchMethods.indexOf(key) !== -1) { // src/lib/reactivity/reactive.js:68
  return function (...args) {
    pauseTracking()
    const result = target[key].apply(this, args)
    resumeTracking()
    trigger(_parent, _key)
    // ...
```

Rules:

- No object creation, no deep walks, no `Log.*` inside `track`/`trigger`, array-patch wrappers, `effect` bodies, or the `frameTick` emit path (`src/component.js:308-343` only wires `renderer.on` — no validation there)
- Short-circuit equality before writing: the `deepEqualArray` / `oldRawValue === rawValue` guard in `src/lib/reactivity/reactive.js:111-140` exists so watchers and effects don't refire — preserve it when touching that path
- Effects are unkeyed subscriptions (`effect(eff)` with `key = null`, except for-loop internals) that re-run on any tracked dep — keep generated effect bodies pure and minimal. Every `:attr` in a user template becomes one such effect, which is why the binding-tier guidance exists for app developers

### 4. Early Returns & Flat Code

```javascript
// ✅ DO: guards first, flat body (src/focus/focus.js:44-56, src/router/router.js:167-179)
if (route === false) {
  Log.error(`Route ${hash.hash} not found`)
  return
}
if (this.currentRoute !== undefined && sameRouteObject(route, this.currentRoute)) return

// Navigation concurrency uses a counter, not a boolean (src/router/router.js:84-94)
if (activeNavigations++ === 0) {
  state.navigating = true
}
// ... finishNavigation() decrements back to zero

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

## Template Code Generator (Contributor Protocol)

This is the heart of Blits. Get the protocol wrong and nothing renders. All refs are `src/lib/codegenerator/generator.js` unless noted.

### Pipeline and Call Sites

- Parser (`src/lib/templateparser/parser.js:21`): hand cursor parser. Only `name="value"` attributes (single/double quotes, `attrNameRegex` at `src/lib/templateparser/parser.js:31`), dot-attrs split in `formatAttribute` (`src/lib/templateparser/parser.js:183-188`; `:x.transition="…"` → `{transition: …}`), colors normalized (`src/lib/templateparser/parser.js:202-232`), text stored as `Symbol.for('tagContent')` (`src/lib/templateparser/parser.js:144-146`). Structural rules in `format` (`src/lib/templateparser/parser.js:248-322`): single root (`:258-266`), no `:for` on root (`:261-266`), level validation and node assembly (`:283-314`). Errors are `TemplateParseError` / `TemplateStructureError` (`:329-380`).
- Generator entry `src/lib/codegenerator/generator.js:23`: builds `renderCode` + `effectsCode` + `cleanupCode`, returns `{elms, cleanup, skips}` (`:75-88`).
- Emitted signatures — **these must match the call sites exactly**:
  - `render = new Function('parent','component','context','components','effect','getRaw','Log', …)` (`:91-100`) called as `config.code.render.apply(stage, [parentEl, this, config, globalComponents, effect, getRaw, Log])` (`src/component.js:273-281`; `this` is `stage`, so generated `this.element(...)` resolves to `stage.element`)
  - each `effectsCode` entry becomes `new Function('component','elms','context','components','rootComponent','skips','effect', …)` (`:101-113`) invoked as `effects[i](this, children, config, globalComponents, rootComponent, skips, effect)` inside `effect(eff)` (`src/component.js:379-394`)
  - AOT serializes the same functions via `render.toString()` (`src/lib/precompiler/precompiler.js:56-61`); `generator.test.js` asserts on the emitted strings. Adding/removing a parameter breaks JIT + AOT + tests together.

### Static vs `$` Dynamic vs `:` Reactive Emission

Detection is key-prefix only: `isReactiveKey = str.startsWith(':')` (`:993`).

| Tier | Example | Emission (`generateElementCode:231-264`, components `:388-406`) |
|---|---|---|
| `static` `attr="lit"` | `w="100"` | `elementConfigs[i]['attr'] = cast(…)` (`:261`). No `effectsCode` |
| `dynamic` `attr="$foo"` (no `:`) | `w="$w"` | Same one-shot `cast()` path — initial config only, no subscription |
| `reactive` `:attr="expr"` | `:w="$foo * 2"` | **Both** `elementConfigs[i]['attr'] = interpolate(…)` initial (`:250-255`) **and** `effectsCode.push(elms[i].set('attr', interpolate(…)))` (`:239-244`); components write `Symbol.for('props')['attr']` (`:390-394`, arrays via `getRaw().slice(0)` `:395-400`) |

- `$foo → component.foo`, `$$ → component.$`; `'...'` literals are masked before substitution and restored after (`interpolate:818-852`). Tag text `{{…}}` becomes string concat via `parseTagContent:945-991`.
- `cast:854-932` order matters: `content` → numeric (with `%` resolved against `parent.node.w/h` for `w,width,x` / `h,height,y`:875-886) → booleans → `@listener` (`component['x'] && component['x'].bind(component)`:900-902) → `$var` → `$`-containing objects → static string.
- Component holders: `:attr` effects on holders are guarded by `skips` (`:234-235`) — non-`validAttributes` props are deleted from `elementConfigs` and recorded in `skips[i]` (`:293-302`, keys from `src/engines/L3/element.js:588` via the `elementAttributes` import at `src/lib/codegenerator/generator.js:21`).
- `:for` (`generateForLoopCode:474-787`): `scope = Object.create(component)` per index (`:591`); `scope['item']` / `scope['key']` assignment (`:593-602`); loop-body refs use `scope.` prefix while outer refs keep `component.` (`:750-760`); outer-scope `:attr`s get their own loop re-running all indices (`:765-781`); destroy code is injected (`:685-718`) and `forStartCounter/forEndCounter` (`:482,693`) must span exactly that loop's nodes. Missing stable `:key` collapses keys to index and destroys/recreates (`:559`). `$shallow` defaults `true` (`:484-488`); `false` mutates the scope chain (`:654-656`). Static `ref` in a loop becomes `scope['__ref']` (`:604-609`).
- Module-global `counter` (`:18,52`): snapshot `holderCounter` before generating children (`:360`); nested components must not leak counts across loops.

### Extending Template Syntax (In Order)

1. `src/lib/templateparser/parser.js:29-33,159-181`: extend `attrNameRegex`/`tagStartRegex`; add a branch in `formatAttribute` (`:183-188`, like the dot-split at `:186`); add structural rules in `format` (`:248-322`) if needed (cf. the `:for`-on-root rule at `:261-266`).
2. `src/lib/codegenerator/generator.js:993` + branches at `:231-264` (elements) mirrored at `:388-406` (components): decide `effectsCode.push(elms[i].set…)` vs `props[…]` and initial `elementConfigs`/`props` via `interpolate` (expression) or `cast` (typed literal).
3. Value grammar in `interpolate:818-852` / `cast:854-932` / `parseTagContent:945-991` — keep `$`→`component`, `$$`→`component.$`, and `'...'` masking in sync across all three.
4. New structural directives: `generateCode` dispatch (`:789-816`) + `generateForLoopCode` mechanics (`:474-787`; `counter`, `scope.` vs `component.`, inner/outer effect split at `:645-652`, destroy injection at `:685-718`, `effect()` key list at `:727-738`).
5. Runtime mapping in `src/engines/L3/element.js:propsTransformer` (`:236-586`; `%` handling at `:244-269`, `content` → `text` at `:540`) + `populate` (`:596`) / `set` (`:804`, transitions at `:820-828`) / `animate` (`:840-877`) if the attribute needs renderer behavior; `elementAttributes` (`:588`) feeds the codegen prop/attr split — change both together.
6. No `src/lib/precompiler/precompiler.js` change needed if reusing `parser`+`generator` (verify the `mode === 'development'` flag still threads through at `:53`); add cases to `parser.test.js` / `generator.test.js`; extend `vite/reactivityGuard` (`vite/reactivityGuard.js:38`, guards built in `src/lib/reactivityguard/computedprops.js:261-396`) if the syntax introduces new `this.` reads in `computed`.

## Symbols Registry

`src/lib/symbols.js:80-147` — local `Symbol()` for private instance slots; `Symbol.for()` (global registry) **only** for keys the generated `new Function(...)` strings must share (`children`, `components`, `config`, `props`, `slots`, `componentType`, `isComponent`, `effects`, `removeEffects`, `tagContent`, `isSlot`, `isSprite`).

```javascript
// ✅ DO: symbols for internals (src/component.js:219-283)
this[symbols.parent] = parentComponent
this[symbols.holder] = parentEl
this[symbols.props] = reactive(/* ... */)
this[symbols.state] = reactive(/* ... */)
factory[Symbol.for('config')] = config // src/component.js:510 — never factory.config

// ❌ NEVER: string keys for framework slots (collides with user state/props/methods)
this.parent = parentComponent // NO
```

User `state`/`props`/`methods`/`computed` share the component namespace and collisions are `Log.error`s (`src/component/setup/state.js:49-55`, `src/component/setup/computed.js:28-35`) — internals must be physically unable to collide.

## Component Setup Pipeline (Adding a Feature)

Fixed order in `src/component/setup/index.js:32-62`: `identifier → registerHooks → props → methods → state → computed → watch → router → input`. To add a new config key (e.g. `config.throttle`):

1. New file `src/component/setup/<key>.js` following the existing shape (`export default (component, <value>) => { … }`, `symbols.<key>Keys` bookkeeping, `Object.defineProperty` accessors like `src/component/setup/state.js:58-64`).
2. Collision checks against `symbols.propKeys`/`methodKeys`/`stateKeys` with `Log.error`, mirroring `src/component/setup/state.js:45-56` / `src/component/setup/computed.js:27-39`.
3. Wire into `setup/index.js` in dependency order (props before methods/state since they validate against each other).
4. If the key needs template access, extend codegen (previous section) — don't bolt reactive reads on outside the `effect` protocol.
5. If it needs per-instance cleanup, register it so `destroy()` releases it; expose time-based behavior through `src/component/base/timeouts_intervals.js` (`$setTimeout`/`$clearTimeout`/…) so teardown is automatic.

Base composition lives in `src/component/base/index.js:28-47`: `shared = {…events, …router, …announcer, $reactive}` merged via `Object.defineProperties` — new `$`-helpers go in `src/component/base/*.js` as `value: function (…) {}` descriptors with `@this {import('../../component').BlitsComponent}` annotations (cf. `src/component/base/methods.js:31-33`).

## Code Patterns

### Factory + Prototype Pattern

```javascript
// ✅ DO: factories closing over config (src/component.js:207, src/application.js:39, src/launch.js:114)
const Component = (name = required('name'), config = required('config')) => { /* ... */ }
const Application = (config) => { /* ... */ }
export default (App, target, settings) => { /* ... */ }

// ✅ DO: plain-object singletons for cross-cutting state
const settings = { [symbols.settings]: {}, get(key, defaultValue = null) { /* ... */ } } // src/settings.js:20-22
export default { _hold: false, set hold(v) { /* ... */ }, get() { /* ... */ } } // src/focus/focus.js:32-43

// ✅ DO: defineProperties composition (src/component/base/index.js:42-47, src/lib/log.js:44-89)
export default Object.defineProperties({ [symbols['launched']]: false }, { ...methods, ...scheduling, ...shared, ...utils })

// ❌ NEVER: class for framework objects (the only `class` in src/ are shims: InternalKeyboardEvent, localCookie, TestKeyboardEvent)
```

### `this`-Preserving Invocation

```javascript
// ✅ DO: .apply/.call with component receiver (src/component.js:257, src/component/setup/computed.js:43)
(config.state && typeof config.state === 'function' && config.state.apply(this)) || {}
return computeds[computed].apply(this)
cb = inputEvents[key].call(componentWithInputEvent, event) // src/focus/focus.js:96
result = await hooks[hookName].call(parent, route, previousRoute) // src/router/router.js:459
```

### Router / Focus Internals Worth Knowing

- Router (`src/router/router.js`): `navigate` at `:134` → `performNavigation` with `sameRouteObject` early-exit (`:177`), `executeBeforeHook` at `:447` (`false` cancels, `string`/`object.path` redirects), `loadPage` at `:495` (factory/promise/`Module.default`), `reuseComponent` re-props in place (`:261-268`) vs `keepAlive` cache (`:352-394`) vs `oldView.destroy()`. Route `params`/`data` are merged into props (`:250-268`) — components must declare them.
- Focus (`src/focus/focus.js:43-104`): guards (`undefined`/`eol`/duplicate, `state.navigating`), ancestor-diff unfocus via `while (i--)`, parent path set to `focus`, leaf applied async honoring `holdTimeout` (`:79-82`); `getComponentWithInputEvent:113-123` bubbles to the nearest ancestor with a matching handler.
- Engines (`src/engine.js:18`, `src/engines/index.js:18`): the engine exposes `{Element, Launch}`; `stage.element = engine.Element` (`src/launch.js:144`) and `renderer = engine.Launch(App, target, settings)` (`src/launch.js:146`). New engine work belongs under `src/engines/<Name>/{element,launch,nodeAdapter}.js`.
- Plugins (`src/plugin.js:25-42`): `registerPlugin(fn, name, opts)` → `this.$name` on every component via `Object.defineProperties(Base, pluginInstances)` (`src/component.js:476`); `throw` on missing name (`src/plugin.js:35-36`). Built-ins in `src/plugins/`.

## Logging & Validation (Blits Equivalent of DEV Guards)

Blits has no compile-time strip — `Log` is runtime-gated by `Settings.get('debugLevel')` (`src/lib/log.js:41-117`), with `console.*` encapsulated inside the logger. Same spirit as FTL's `if (DEV)`: loud at the boundary, silent in the hot path.

```javascript
// ✅ DO: Log.warn recoverable, Log.error contract violations — at setup/entry only
Log.error(`State ${key} already exists as a prop`) // src/component/setup/state.js:49
Log.warn('Defining props as an Array has been deprecated ...') // src/component/setup/props.js:22
Log.warn(`RouterView "${routerViewName}" was not found ...`) // src/component/base/router.js:77
Log.error(`Route ${hash.hash} not found`) // src/router/router.js:168

// ✅ DO: throw only for missing required contracts
const required = (name) => { throw new Error(`Parameter ${name} is required`) } // src/component.js:47-49
throw new Error('Component "${...}" not found') // src/lib/codegenerator/generator.js:415
if (name === undefined || name === '') { throw Error('Error registering plugin: ...') } // src/plugin.js:35-36
```

### Rules

1. **Only validate at public API boundaries** — `Component()`, `Application()`, `Launch()` (`src/launch.js:117-131`), `navigate()` / `$router.to()`, `registerPlugin()`, parser/generator entry. Never inside effects, `frameTick`, or per-node `populate`/`set`.
2. **`Log.warn` recoverable misuse, `Log.error` contract violations** — name collisions error, deprecated array props warn once, props mutation warns (`src/component/setup/props.js:64-68`).
3. **Explicit comparisons** — `typeof x !== 'function'`, `x === null`, `Array.isArray(x) === true`. No truthy/falsy checks.
4. **Never validate deeper than the top-level call** — check the argument exists and has the right shape; don't recursively walk templates, routes, or state trees per call.

### What NOT to do

```javascript
// ❌ NEVER: raw console in framework code — use Log
console.warn(`${watch} is not a function`) // NO — src/component/setup/watch.js:26 is a known violation, don't copy it

// ❌ NEVER: logging in hot paths
const renderEffect = () => {
  Log.info('effect ran') // NO — fires on every state change
}
```

## Function Guidelines

### Function Signature Style

```javascript
// ✅ DO: Arrow functions for pure/internal helpers
const normalizeProps = (props) => { /* ... */ } // src/component/setup/props.js:21
const reactiveProxy = (original, _parent = null, _key) => { /* ... */ } // src/lib/reactivity/reactive.js:31
export const effect = (effect, key = null) => { /* ... */ } // src/lib/reactivity/effect.js:92
export const getHash = (hash, routerViewName = '') => { /* ... */ } // src/router/utils.js:7

// ✅ DO: function + @this for anything needing component this
// src/component/setup/index.js:32, src/component/base/methods.js:30-33
export default function (component, config) { /* ... */ }
/**
 * @this {import('../../component').BlitsComponent}
 */
value: function (e) { /* ... */ }
```

Codegen itself is `export default function (templateObject = { children: [] }, devMode = false)` (`src/lib/codegenerator/generator.js:23`) — `function` because the precompiler invokes it with `.call({components}, …)`.

### JSDoc Type Annotations

**Do not use inline `/** @type {Type} */` casts** in expressions (e.g. `const x = /** @type {Foo} */ (bar)`).

**Do not use the `any` type in JSDoc.**

Standard `@param {Type}`, `@returns {Type}`, `@this {Type}`, and `@typedef` blocks are required on new public APIs — see `@typedef {Object} BlitsSettings` + `@property` entries (`src/launch.js:65-95`), `BlitsComponent`/`BlitsComponentConfig` (`src/component.js:127-199`), `Route`/`Hash` (`src/router/router.js:38-79`), `BlitsSymbols` (`src/lib/symbols.js:18-73`).

```javascript
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

1. **Never use classes for framework objects** - Factories, plain objects, `Object.create`/`Object.defineProperties`
2. **Never use arrow functions where component `this` is needed** - Setup runners, `value: function` descriptors, and all user-callback invocations use `.apply(this)`/`.call(this)`
3. **Never use string keys for framework internals** - Use `symbols.*`; `Symbol.for()` only for keys generated code must share
4. **Never change a codegen `new Function` signature on one side only** - `src/lib/codegenerator/generator.js:91-113`, `src/component.js:273-281,379-394`, `src/lib/precompiler/precompiler.js:56-61`, and `generator.test.js` change together
5. **Never add validation/logging to hot paths** - No `Log`, no checks inside `track`/`trigger`, array-patch wrappers, `effect` bodies, `frameTick` handlers, or per-node `populate`/`set`
6. **Never use truthy/falsy checks** - Explicit `=== null`, `!== undefined`, `Array.isArray(x) === true`, `indexOf(...) > -1`
7. **Never use forEach/map in reactive or per-frame paths** - Indexed `for` with cached length; `while` for walks; `for...in` for user tables
8. **Never nest more than 3 levels deep** - Early returns (`undefined` / `eol` / duplicate / `navigating` guards first)
9. **Never use raw `console.*` in framework code** - `Log.info/warn/error/debug` (gated by `debugLevel`); `throw` only for missing required contracts
10. **Never break the setup order** - `identifier → hooks → props → methods → state → computed → watch → router → input` (`src/component/setup/index.js:32-62`); new keys validate collisions like `src/component/setup/state.js` / `src/component/setup/computed.js` do
11. **Never leak timers / listeners / renderer events** - Route through `$setTimeout`/`$setInterval`/`$debounce`/`$emit`/`$listen` so `destroy()` cleans up
12. **Never use inline JSDoc type casts** - No `/** @type {X} */ (expr)`; no `any` in JSDoc

## Code Review Checklist

Before submitting code, verify:

- [ ] Factories / plain objects / `Object.create` / `Object.defineProperties` used; no new `class` in framework code
- [ ] Arrows for helpers, `function` + `@this` where component `this` matters; user callbacks invoked via `.apply(this)`/`.call(this)`
- [ ] Framework slots use `symbols.*` (`Symbol.for()` only for generated-code keys); no new string keys on components/elements
- [ ] Codegen signature changes applied on all sides: `generator.js`, `component.js` call sites, `precompiler.js`, `generator.test.js`/`parser.test.js`
- [ ] New template syntax follows the ordered recipe (parser → key prefix → element/component branches → value grammar → runtime transformer → tests); `skips`/`elementAttributes` contract preserved
- [ ] New config keys follow the setup recipe (setup module → collision checks → ordered wiring → codegen if template-visible → cleanup)
- [ ] Engine changes preserve the `{Element, Launch}` facade
- [ ] All comparisons explicit (`===`, `!==`, `Array.isArray(x) === true`, `indexOf > -1` in hot paths)
- [ ] Indexed `for` / `while` in hot paths; no `forEach`/`map` outside setup; no nesting beyond 3 levels; early returns on top
- [ ] No allocation, deep walks, or logging in `track`/`trigger`, effects, watchers, `frameTick`, or `populate`/`set`; equality short-circuits preserved
- [ ] `Log.warn` recoverable / `Log.error` violations at boundaries only; `throw` only for missing contracts; no `console.*`
- [ ] No inline JSDoc casts; no `any`; new public APIs carry `@param` / `@returns` / `@typedef` / `@this`
- [ ] Style matches enforcement: single quotes, no semicolons, 2-space indent, print width 100, LF (`eslint.config.cjs:61-86`, `.editorconfig`)
- [ ] Tests added/updated (`tape` + `global-jsdom`; codegen tests assert emitted strings; `renderComponent` fixture with `focus()` before `input()` and `destroy()` after); `npm run test:run` and `npm run lint` pass

## Common Patterns to Follow

Look at these files for reference patterns:

- [`src/component.js`](src/component.js) - Component factory, codegen invocation, effects/watcher wiring, plugin installation
- [`src/component/base/index.js`](src/component/base/index.js) - `defineProperties` composition (`methods`, `scheduling`, `shared`, `utils`)
- [`src/component/setup/index.js`](src/component/setup/index.js) - Setup order and per-key modules (`props.js`, `state.js`, `computed.js`, `watch.js`, `input.js`, `routes.js`)
- [`src/lib/symbols.js`](src/lib/symbols.js) - `Symbol()` vs `Symbol.for()` registry
- [`src/lib/templateparser/parser.js`](src/lib/templateparser/parser.js) - Cursor parser, attribute grammar, structural rules
- [`src/lib/codegenerator/generator.js`](src/lib/codegenerator/generator.js) - Static/dynamic/reactive emission, `interpolate`/`cast`, `:for` internals
- [`src/lib/reactivity/reactive.js`](src/lib/reactivity/reactive.js) + [`src/lib/reactivity/effect.js`](src/lib/reactivity/effect.js) - Proxy reactivity, sync effects, equality guards
- [`src/lib/lifecycle.js`](src/lib/lifecycle.js) - Lifecycle states and transitions
- [`src/lib/hooks.js`](src/lib/hooks.js) - Hook registration/emission
- [`src/lib/precompiler/precompiler.js`](src/lib/precompiler/precompiler.js) + [`vite/`](vite/) - AOT precompile, `reactivityGuard`, plugin order
- [`src/router/router.js`](src/router/router.js) - Navigation flow, reuse vs `keepAlive` vs destroy
- [`src/focus/focus.js`](src/focus/focus.js) - Focus chain + input bubbling
- [`src/launch.js`](src/launch.js) - `Launch()` settings, engine selection, singletons
- [`src/engine.js`](src/engine.js) + [`src/engines/`](src/engines/) - `{Element, Launch}` facade and L3 implementation
- [`src/settings.js`](src/settings.js) + [`src/lib/log.js`](src/lib/log.js) - Settings store + gated logging
- [`src/plugin.js`](src/plugin.js) + [`src/plugins/`](src/plugins/) - Plugin registration
- [`src/testing/`](src/testing/) - `renderComponent` test harness

## Appendix: App-Developer Primer (Context, Not the Job)

Framework changes must be validated against app ergonomics. The one-paragraph version: templates have three binding tiers — `attr="literal"` (static, baked once), `attr="$var"` (dynamic, set once), `:attr="expr"` (reactive, subscribes one `effect` per binding, so it is the most expensive). Lists need `:for` + stable `:key="$item.id"` + `:range` windowing for rails; input is local handlers bubbling to the nearest ancestor with a match; routes lazy-load via `() => import()` with `keepAlive`/`reuseComponent` mutually exclusive. Details live in `docs/`: template syntax (`docs/essentials/template_syntax.md`), element attributes (`docs/essentials/element_attributes.md`), `for`-loops (`docs/built-in/for-loop.md`), lazy loading (`docs/performance/lazy-loading.md`), router (`docs/router/`), user input (`docs/components/user_input.md`), testing (`docs/testing/test-harness.md`).

Remember: you are building the framework, not the app. Do work once at parse/setup time, keep every per-frame path allocation-free and log-free, honor the codegen and symbols contracts, and keep the authoring experience delightful.
