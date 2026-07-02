# Application Settings

Blits provides a flexible and performant way to configure your application at launch using the settings object passed to `Blits.Launch`. These settings allow you to fine-tune rendering, performance, input, fonts, and more.

Below is a comprehensive overview of the available settings you can provide to a Blits Application:

## Basic Settings

| Setting         | Type                | Description |
|----------------|---------------------|-------------|
| `w`            | `number`            | Width of the application (canvas) |
| `h`            | `number`            | Height of the application (canvas) |
| `debugLevel`   | `number \| string[]`| Debug level for console log messages |
| `multithreaded`| `boolean`           | Enable multithreaded rendering |

## Fonts & Text

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `fonts`        | `Font[]`  | Array of font objects to register |
| `defaultFont`  | `string`  | Default font family to use |

Example font object:
```js
{
  family: 'lato',
  type: 'msdf', // or 'web'
  file: 'fonts/Lato-Regular.ttf',
}
```

## Rendering & Performance

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `renderQuality` | `'low' \| 'medium' \| 'high' \| 'retina' \| number` | Controls render quality (1 = 100%) |
| `screenResolution` | `'hd' \| 'fhd' \| '4k' \| number` | Sets device screen resolution |
| `pixelRatio`    | `number`  | Custom pixel ratio (overrides screenResolution) |
| `canvasColor`   | `string`  | Background color of the canvas |
| `fpsInterval`   | `number`  | Interval (ms) for FPS updates (0 disables) |
| `webWorkersLimit` | `number`| Max number of web workers for image handling |
| `gpuMemory`     | `object`  | GPU memory management (see below) |
| `gpuMemoryLimit`| `number`  | (Deprecated) Use `gpuMemory` instead |
| `textureProcessingTimeLimit` | `number` | Max ms per frame for texture processing |
| `viewportMargin`| `number \| [number,number,number,number]` | Extra margin for preloading elements |
| `advanced`      | `object`  | Advanced renderer settings (use with care) |

### GPU Memory Example
```js
{
  max: 200, // MB
  target: 0.8, // 80% of max
  cleanupInterval: 5000, // ms
  baseline: 25, // MB
  strict: false
}
```

## Input & Focus

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `keymap`       | `object`  | Custom key mapping for input events |
| `holdTimeout`  | `number`  | Time (ms) to consider a key press as hold |
| `inputThrottle`| `number`  | Input throttle time (ms) to prevent rapid successive inputs |
| `enableMouse`  | `boolean` | Enable mouse support (hover and click-to-focus). Defaults to false. |

## Renderer

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `renderMode`   | `'webgl' \| 'canvas'` | Renderer mode (default: 'webgl') |
| `canvas`       | `HTMLCanvasElement` | Custom canvas to render to |
| `rendererPlatform` | `object` | Custom platform configuration passed to the renderer |

## Platform

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `platform`     | `function` | Custom platform capabilities used by Blits |

The `platform` setting can be used when Blits is not running in a regular browser environment, or when you want to provide custom platform specific implementations.

The function receives the default browser platform as first argument, and should return the platform parts you want to override. All other platform functions will keep using the default browser implementation.

```js
Blits.Launch(App, 'app', {
  platform: (defaults) => ({
    screenHeight: screen.height,
    input: {
      addEventListener(type, listener, options) {
        if (type === 'keydown') {
          myInput.on('keydown', listener)
          return
        }

        defaults.input.addEventListener(type, listener, options)
      },
      removeEventListener(type, listener, options) {
        if (type === 'keydown') {
          myInput.off('keydown', listener)
          return
        }

        defaults.input.removeEventListener(type, listener, options)
      },
    },
  }),
})
```

Common platform properties that can be overwritten are `input`, `viewport`, `dispatchEvent`, `localStorage`, `getCookie`, `setCookie`, `historyBack`, `screenHeight`, `hardwareConcurrency`, `userAgent`, `KeyboardEvent`, `isKeyboardEvent`, `createKeyboardEvent`, `announcer`, and `now`.

The `announcer` platform property can be used to provide a custom text-to-speech driver. When set, Blits keeps using the built-in announcer queue and calls the custom driver's `speak(options)` and `cancel()` methods instead of the default Web Speech implementation.

```js
Blits.Launch(App, 'app', {
  announcer: true,
  platform: (defaults) => ({
    announcer: {
      speak(options) {
        return myPlatformSpeech.speak(options.message)
      },
      cancel() {
        myPlatformSpeech.cancel()
      },
    },
  }),
})
```

For LG webOS apps, Blits provides a webOS announcer factory that calls the platform TTS service.

```js
import createAnnouncer from '@lightningjs/blits/platforms/webOS/announcer'

Blits.Launch(App, 'app', {
  announcer: true,
  platform: () => ({
    announcer: createAnnouncer(),
  }),
})
```

The `rendererPlatform` setting is separate from `platform`. It is only passed to the renderer, and should be used for renderer specific platform configuration.

## Effects & Shaders

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| ~~`effects`~~  | `ShaderEffect[]` | Effects for DynamicShader. **Removed in Blits v2.** Use the `shaders` setting instead. |
| `shaders`      | `Shader[]` | Custom shaders |

## Inspector & Debugging

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `inspector`    | `boolean` | Enable the inspector tool |

## Accessibility

| Setting         | Type      | Description |
|----------------|-----------|-------------|
| `announcer`    | `boolean` | Enable/disable text-to-speech announcer |

## Example Usage

```js
Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  debugLevel: 1,
  renderQuality: 'high',
  fonts: [
    { family: 'lato', type: 'msdf', file: 'fonts/Lato-Regular.ttf' },
  ],
  keymap: {
    ArrowLeft: 'left',
    ArrowRight: 'right',
  },
  holdTimeout: 50,
  inputThrottle: 100, // Throttle inputs to 100ms window
  gpuMemory: {
    max: 200,
    target: 0.8,
    cleanupInterval: 5000,
    baseline: 25,
    strict: false,
  },
  inspector: false,
  announcer: true,
  enableMouse: false, // set true for hover + click-to-focus on canvas
  platform: (defaults) => ({
    screenHeight: 720,
    input: myInputTarget,
  }),
})
```
