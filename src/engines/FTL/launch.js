/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// FTL Launch: maps Blits launch settings onto FTL `main({platform, renderer,
// text, config})` and owns the FTL app singleton (mirrors L3/launch.js
// `export let renderer`).
//
// Phase 1 (core-only): webgl + canvas render modes, canvas text engine only.
// MSDF/SDF fonts, custom shaders, inspector, pixelRatio/renderQuality and
// advanced renderer settings are warn-and-skip (see README-FTL.md).
//
// FTL is an OPTIONAL peer dependency (`ftl` + subpaths `ftl/platform/browser`,
// `ftl/renderer/webgl`, `ftl/renderer/canvas`, `ftl/text/canvas`,
// `ftl/shaders`, `ftl/shaders/create`). All FTL imports are dynamic inside
// `Launch()` so the L3 bundle/test path never touches them.
//
// Async note: dynamic imports make this function async. Blits `src/launch.js`
// passes an `onRenderer` callback which is invoked with the renderer facade
// BEFORE the app components are constructed, so the global `renderer`
// binding is populated in time.

import { Log } from '../../lib/log.js'
import colors from '../../lib/colors/colors.js'

/** @type {any|null} FTL app singleton created by Launch(). */
export let ftlApp = null

/** @type {any|null} Renderer facade exposed as Blits `renderer` for FTL apps. */
export let rendererFacade = null

/**
 * Resolve the launch target to a container element. Blits passes either an
 * element or an id string (the example app passes `'app'`).
 */
const resolveTarget = (target) => {
  if (target === undefined || target === null) return null
  if (typeof target === 'string') {
    if (typeof document === 'undefined') return null
    return document.getElementById(target)
  }
  return target
}

/**
 * Resolve (or create) the canvas to render into.
 */
const resolveCanvas = (targetEl, settings, w, h) => {
  if (settings.canvas) return settings.canvas
  if (targetEl) {
    const existing = targetEl.tagName === 'CANVAS' ? targetEl : targetEl.querySelector('canvas')
    if (existing) {
      existing.width = w
      existing.height = h
      return existing
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  if (targetEl && typeof targetEl.appendChild === 'function') {
    targetEl.appendChild(canvas)
  }
  return canvas
}

const hexToRgbaFloat = (hex) => {
  const h = ('' + hex).replace('0x', '').replace('#', '')
  if (/^[0-9a-f]{8}$/i.test(h) === false) return [0, 0, 0, 0]
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
    parseInt(h.slice(6, 8), 16) / 255,
  ]
}

/**
 * Renderer facade: gives Blits core (`component.js` hooks, `application.js`
 * mouse, `FPScounter`) the `RendererMain` surface it expects, backed by FTL
 * signals. `stage` is intentionally absent in phase 1 (no mouse picking);
 * `application.js` already guards `renderer.stage == null`.
 */
const createFacade = (app, canvas, settings) => {
  const subs = { idle: new Set(), active: new Set(), frameTick: new Set(), fpsUpdate: new Set() }
  let isIdle = false
  let frames = 0
  let fpsTimer = null

  const fire = (name, ...args) => {
    subs[name].forEach((cb) => {
      try {
        cb(...args)
      } catch (e) {
        Log.error(`[Blits:FTL] renderer '${name}' listener failed`, e)
      }
    })
  }

  if (app.signals && app.signals.idle && typeof app.signals.idle.subscribe === 'function') {
    app.signals.idle.subscribe(() => {
      isIdle = true
      frames = 0
      subs.idle.forEach((cb) => {
        try {
          cb()
        } catch (e) {
          Log.error('[Blits:FTL] idle listener failed', e)
        }
      })
    })
  }

  if (app.signals && app.signals.tick && typeof app.signals.tick.subscribe === 'function') {
    app.signals.tick.subscribe((dt) => {
      if (isIdle === true) {
        isIdle = false
        subs.active.forEach((cb) => {
          try {
            cb()
          } catch (e) {
            Log.error('[Blits:FTL] active listener failed', e)
          }
        })
      }
      frames++
      subs.frameTick.forEach((cb) => {
        try {
          cb(facade, dt)
        } catch (e) {
          Log.error('[Blits:FTL] frameTick listener failed', e)
        }
      })
    })
  }

  // fpsUpdate: derived from tick counts (L3 pushes these from the renderer).
  const fpsInterval = settings.fpsInterval || 1000
  fpsTimer = setInterval(() => {
    if (subs.fpsUpdate.size === 0) return
    const fps = Math.round((frames * 1000) / fpsInterval)
    frames = 0
    fire('fpsUpdate', facade, { fps })
  }, fpsInterval)
  if (fpsTimer && typeof fpsTimer.unref === 'function') fpsTimer.unref()

  const facade = {
    _isFtl: true,
    _ftlApp: app,
    canvas,
    on: (evt, cb) => {
      if (subs[evt] === undefined) {
        Log.warn(`[Blits:FTL] renderer event '${evt}' is not supported in phase 1`)
        return () => {}
      }
      subs[evt].add(cb)
      return () => subs[evt].delete(cb)
    },
    off: (evt, cb) => {
      if (evt === undefined) {
        Object.keys(subs).forEach((k) => subs[k].clear())
        return
      }
      if (subs[evt] === undefined) return
      if (cb === undefined) subs[evt].clear()
      else subs[evt].delete(cb)
    },
    destroy: () => {
      if (fpsTimer !== null) clearInterval(fpsTimer)
      Object.keys(subs).forEach((k) => subs[k].clear())
      if (app && typeof app.stop === 'function') app.stop()
    },
  }
  return facade
}

/**
 * Launch the FTL engine and application.
 *
 * @param {import('../../launch.js').BlitsAppFactory} App - Factory function that returns the application instance.
 * @param {HTMLElement|string} target - The target element (or element id) to render into.
 * @param {Partial<import('../../launch.js').BlitsSettings>} [settings] - Blits settings.
 * @param {(facade: any) => void} [onRenderer] - Called with the renderer facade before App() runs.
 * @returns {Promise<any>} Resolves to the renderer facade.
 */
export default async (App, target, settings = {}, onRenderer) => {
  const w = settings.w || 1920
  const h = settings.h || 1080
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'

  // Note: all specifiers below are static strings (no @vite-ignore) so Vite
  // can resolve and code-split them. They only load when the FTL engine is
  // selected; L3 apps never fetch these chunks.
  const [{ default: main }, { default: platform }, textCanvas] = await Promise.all([
    import('ftl'),
    import('ftl/platform/browser'),
    import('ftl/text/canvas'),
  ])
  const rendererModule =
    renderMode === 'canvas'
      ? await import('ftl/renderer/canvas')
      : await import('ftl/renderer/webgl')

  // Shader bridge modules + stage handle for bucket re-listing. Loaded here
  // (not in shaders.js) so the bridge stays unit-testable without `ftl`.
  // additionalShaders pre-inits every module the bridge may instantiate;
  // per-element instances are created on demand afterwards.
  let shaderBridge = null
  let shaderInstances = []
  let stageMod = null
  try {
    const [bridge, shaderMods, shaderCreateMod, stageModule] = await Promise.all([
      import('./shaders.js'),
      import('ftl/shaders'),
      import('ftl/shaders/create'),
      import('ftl/stage'),
    ])
    shaderBridge = bridge
    stageMod = stageModule
    const mods = {
      createShader: shaderCreateMod.createShader,
      RoundedShader: shaderMods.RoundedShader,
      BorderShader: shaderMods.BorderShader,
      ShadowShader: shaderMods.ShadowShader,
      RoundedWithBorderShader: shaderMods.RoundedWithBorderShader,
      RoundedWithShadowShader: shaderMods.RoundedWithShadowShader,
      RoundedWithBorderAndShadowShader: shaderMods.RoundedWithBorderAndShadowShader,
      LinearGradientShader: shaderMods.LinearGradientShader,
      RadialGradientShader: shaderMods.RadialGradientShader,
      HolePunchShader: shaderMods.HolePunchShader,
    }
    bridge.setShaderModules(mods)
    shaderInstances = [
      'RoundedShader',
      'BorderShader',
      'ShadowShader',
      'RoundedWithBorderShader',
      'RoundedWithShadowShader',
      'RoundedWithBorderAndShadowShader',
      'LinearGradientShader',
      'RadialGradientShader',
      'HolePunchShader',
    ].map((key) => mods.createShader(mods[key]))
  } catch (e) {
    Log.warn('[Blits:FTL] shader modules unavailable — rounded/border/shadow/gradient ignored', e)
  }

  const targetEl = resolveTarget(target)
  const canvas = resolveCanvas(targetEl, settings, w, h)

  let renderer
  if (renderMode === 'canvas') {
    const canvasRenderer = rendererModule.default || rendererModule
    renderer = canvasRenderer(canvas, { sortChildrenByZ: true })
  } else {
    const [{ DefaultRectShader, DefaultTextureShader }, { createShader }] = await Promise.all([
      import('ftl/shaders'),
      import('ftl/shaders/create'),
    ])
    const webglRenderer = rendererModule.default || rendererModule
    renderer = webglRenderer(canvas, {
      rectangleShader: createShader(DefaultRectShader),
      textureShader: createShader(DefaultTextureShader),
      msdfTextShader: null,
      bmfTextShader: null,
      // Pre-inits every module the shader bridge may instantiate later.
      additionalShaders: shaderInstances,
    })
  }

  ftlApp = main({
    platform,
    renderer,
    text: {
      canvas: textCanvas.default || textCanvas,
      defaultTextEngine: 'canvas',
    },
    config: {
      width: w,
      height: h,
      boundsMargin: settings.viewportMargin || 0,
      numImageWorkers: 'webWorkersLimit' in settings ? settings.webWorkersLimit : 2,
    },
  })
  ftlApp.canvas = canvas

  // The stage exists from here on (main() called setCurrentStage) — publish
  // it to the shader bridge for bucket re-listing on shader null<->set.
  if (shaderBridge !== null && stageMod !== null) {
    try {
      shaderBridge.setStage(stageMod.getCurrentStage())
    } catch (e) {
      Log.warn('[Blits:FTL] could not publish stage to shader bridge', e)
    }
  }

  // Animation engine (optional peer `animejs`): FTL owns the rAF loop, so
  // AnimeJS runs in manual mode, driven by FTL ticks. `hasRunningTweens`
  // keeps the loop alive while tweens run — no AnimeJS privates involved.
  // A missing peer degrades to instant transitions (warned in element.js).
  try {
    const [tweenMod, animeMod] = await Promise.all([import('./tween.js'), import('animejs')])
    if (
      animeMod === undefined ||
      animeMod.engine === undefined ||
      typeof animeMod.animate !== 'function' ||
      typeof animeMod.cubicBezier !== 'function'
    ) {
      throw new Error('unexpected shape (need engine/animate/cubicBezier)')
    }
    tweenMod.setAnimationEngine({
      engine: animeMod.engine,
      animate: animeMod.animate,
      cubicBezier: animeMod.cubicBezier,
    })
    const animeEngine = animeMod.engine
    animeEngine.useDefaultMainLoop = false
    ftlApp.addActiveCheck(() => tweenMod.hasRunningTweens())
    ftlApp.signals.tick.subscribe(() => {
      try {
        animeEngine.update()
      } catch (e) {
        Log.error('[Blits:FTL] animation engine update failed', e)
      }
    })
  } catch {
    Log.warn(
      '[Blits:FTL] `animejs` peer not installed — transitions apply instantly (`npm i animejs`)'
    )
  }

  // Dev-only handle for debugging (`window.__blitsFtl.root`, `.createElement`,
  // ...). Stripped from production builds by the Blits vite precompiler define.
  if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    window.__blitsFtl = ftlApp
  }

  if (settings.canvasColor) {
    try {
      const normalized = colors.normalize(settings.canvasColor)
      if (renderer.setClearColor) renderer.setClearColor(hexToRgbaFloat(normalized))
    } catch (e) {
      Log.warn('[Blits:FTL] could not apply canvasColor', e)
    }
  }

  // Fonts: the phase-1 canvas text engine can load any web-font file
  // (ttf/otf/woff). MSDF/SDF entries that point at a font file are loaded the
  // same way (canvas-grade shaping — no SDF fidelity); only atlas-only
  // entries with no loadable file are skipped.
  const fonts = settings.fonts || []
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i]
    const url = font.file || font.url
    if (url !== undefined && /\.(ttf|otf|woff2?|eot)(\?.*)?$/i.test(url)) {
      try {
        await ftlApp.loadFont('canvas', { family: font.family, url })
      } catch (e) {
        Log.warn(`[Blits:FTL] failed to load font '${font.family}'`, e)
      }
    } else {
      Log.warn(
        `[Blits:FTL] font '${font.family}' (type '${font.type}') has no loadable font file, using canvas fallback`
      )
    }
  }

  if (settings.shaders && settings.shaders.length > 0) {
    Log.warn('[Blits:FTL] custom shaders need the phase-2 shader bridge, ignoring')
  }
  if (settings.inspector === true) {
    Log.warn('[Blits:FTL] inspector is not supported with FTL in phase 1')
  }

  rendererFacade = createFacade(ftlApp, canvas, settings)

  // Publish the facade BEFORE constructing components so Blits core
  // (`component.js` reading the global `renderer` binding) sees it in time.
  if (typeof onRenderer === 'function') onRenderer(rendererFacade)

  const initApp = () => {
    let app = App()
    const prevQuit = app.quit
    app.quit = () => {
      Log.info('Closing App (FTL)')
      if (typeof prevQuit === 'function') prevQuit.call(app)
      else if (typeof app.destroy === 'function') app.destroy()
      rendererFacade.destroy()
      app = null
      ftlApp = null
      rendererFacade = null
    }
  }

  // Mirror L3: defer app init a tick so setup settles before components render.
  Promise.resolve().then(initApp)

  return rendererFacade
}
