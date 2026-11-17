# Runtime Settings — Detailed Reference

Every component has access to `this.$settings`. Any launch setting can be read, and a subset of settings can be changed while the App is running.

```js
this.$settings.get('renderMode') // 'webgl'
this.$settings.set('canvasColor', 'darkblue')
```

For the full list of all available launch settings, see [`docs/essentials/settings.md`](./settings.md).

Runtime-changeable settings fall into two categories:

1. [Renderer settings](#1-renderer-settings) — forwarded to the Lightning renderer
2. [Blits settings](#2-blits-settings) — handled entirely within Blits, never touching the renderer

---

## 1. Renderer settings

| Setting | Description |
|---------|-------------|
| `w` | Width of the application canvas |
| `h` | Height of the application canvas |
| `screenResolution` | Device logical resolution preset or custom ratio |
| `renderQuality` | Physical pixel density / render quality multiplier |
| `canvasColor` | Background color of the canvas (color names, hex, rgb(a) and `0xRRGGBBAA` are supported) |
| `fpsInterval` | Interval (ms) for FPS updates (0 disables) |
| `pixelRatio`  | Custom device logical pixel ratio |
| `viewportMargin` | Extra viewport margin for preloading and bounds updates |
| `maxFPS` | Maximum global frame rate, as used by the renderer |

### `w` / `h`

```js
this.$settings.set('w', 1280)
this.$settings.set('h', 720)
```

### `screenResolution`

```js
this.$settings.set('screenResolution', 'hd')
```

### `renderQuality`

```js
this.$settings.set('renderQuality', 'retina')
```

### `canvasColor`

```js
this.$settings.set('canvasColor', 'darkblue')
```

### `fpsInterval`

```js
this.$settings.set('fpsInterval', 500)
```

### `pixelRatio`

```js
this.$settings.set('pixelRatio', 0.66666667)
```

### `viewportMargin`

```js
this.$settings.set('viewportMargin', [100, 100, 100, 100])
```

### `maxFPS`

```js
this.$settings.set('maxFPS', 30)
```

---

## 2. Blits settings

| Setting | Description |
|---------|-------------|
| `keymap` | Custom keymapping |
| `debugLevel` | Debug level for console log messages |
| `inputThrottle` | Input throttle time in milliseconds to prevent rapid successive inputs |
| `announcerOptions` | Global default utterance options for the announcer |
| `enableMouse` | Enable mouse support (hover and click-to-focus) |
| `mouseMoveThrottle` | Minimum time in milliseconds between two pointer moves that are processed for hover |

### `keymap`

```js
this.$settings.set('keymap', { 37: 'left', 39: 'right', 13: 'select' })
```

### `debugLevel`

```js
this.$settings.set('debugLevel', 2)
```

### `inputThrottle`

```js
this.$settings.set('inputThrottle', 150) // ms
```

### `announcerOptions`

```js
this.$settings.set('announcerOptions', { rate: 1.2, pitch: 1, lang: 'en-US' })
```

### `enableMouse`

```js
this.$settings.set('enableMouse', true)
// ... later
this.$settings.set('enableMouse', false)
```

### `mouseMoveThrottle`

```js
this.$settings.set('mouseMoveThrottle', 16) // ~60fps worth of hover updates
```

---

## Settings that remain launch-only

Settings like `renderMode`, `fonts`, `defaultFont`, `shaders`, `reactivityMode`, `holdTimeout`, `announcer`, `profiler`, and `multithreaded` are **not** included in the runtime-changeable list. Calling `$settings.set()` with any of these keys logs a warning and the value is not applied:

```js
this.$settings.set('renderMode', 'canvas')
// ⚡️ Blits — Setting "renderMode" can not be changed at runtime
```
