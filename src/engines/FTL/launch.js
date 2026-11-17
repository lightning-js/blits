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
// WebGL + Canvas backends, canvas/MSDF fonts and built-in effects. See
// README-FTL.md for the settings and rendering features not yet supported.
//
// FTL is a required dependency (`ftl` + subpaths `ftl/platform/browser`,
// `ftl/renderer/webgl`, `ftl/renderer/canvas`, `ftl/text/canvas`,
// `ftl/shaders`, `ftl/shaders/create`). All FTL imports are dynamic inside
// `Launch()` so importing Blits or its compiler does not initialize FTL.
//
// Dynamic imports make this async. Like L3/launch.js, this only creates the
// renderer; src/launch.js publishes it before constructing the application.

import { Log } from '../../lib/log.js'
import { colorToFtl } from './shaders.js'
import { resolveFontEngine, fontEngines } from './fonts.js'
import { platform as blitsPlatform } from '../../platform.js'

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
  if (settings.canvas) {
    settings.canvas.width = w
    settings.canvas.height = h
    return settings.canvas
  }
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

/**
 * Fit the canvas into its target (or viewport) preserving aspect ratio,
 * mirroring how the L3 renderer sizes its canvas to the display. Without
 * this the 1920x1080 backing store overflows smaller windows and stage
 * content outside the top-left stays unreachable. Refit on resize.
 * @returns {function} cleanup function (removes the resize listener).
 */
const fitCanvas = (canvas, targetEl, w, h) => {
  const fit = () => {
    if (typeof window === 'undefined') return
    const availW = targetEl && targetEl.clientWidth ? targetEl.clientWidth : window.innerWidth
    const availH = targetEl && targetEl.clientHeight ? targetEl.clientHeight : window.innerHeight
    if (availW <= 0 || availH <= 0) return
    const scale = Math.min(availW / w, availH / h)
    canvas.style.width = Math.floor(w * scale) + 'px'
    canvas.style.height = Math.floor(h * scale) + 'px'
  }
  fit()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }
  return () => {}
}

/**
 * Renderer facade: gives Blits core (`component.js` hooks, `application.js`
 * mouse, `FPScounter`) the `RendererMain` surface it expects, backed by FTL
 * signals. `stage` is intentionally absent in phase 1 (no mouse picking);
 * `application.js` already guards `renderer.stage == null`.
 */
export const createFacade = (app, canvas, settings, onDestroy = null) => {
  const subs = { idle: new Set(), active: new Set(), frameTick: new Set(), fpsUpdate: new Set() }
  let isIdle = false
  let frames = 0
  let fpsTimer = null
  let fpsStarted = 0
  let destroyed = false
  const signalUnsubs = []
  const frameData = { time: 0, delta: 0 }

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
    signalUnsubs.push(
      app.signals.idle.subscribe(() => {
        isIdle = true
        subs.idle.forEach((cb) => {
          try {
            cb()
          } catch (e) {
            Log.error('[Blits:FTL] idle listener failed', e)
          }
        })
      })
    )
  }

  if (app.signals && app.signals.tick && typeof app.signals.tick.subscribe === 'function') {
    signalUnsubs.push(
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
        frameData.time = blitsPlatform.now()
        frameData.delta = dt
        subs.frameTick.forEach((cb) => {
          try {
            cb(facade, frameData)
          } catch (e) {
            Log.error('[Blits:FTL] frameTick listener failed', e)
          }
        })
      })
    )
  }

  // Keep the reporting interval mutable for this.$settings.set('fpsInterval').
  const setFpsInterval = (interval) => {
    if (fpsTimer !== null) clearInterval(fpsTimer)
    fpsTimer = null
    frames = 0
    if (destroyed === true || interval <= 0) return
    fpsStarted = blitsPlatform.now()
    fpsTimer = setInterval(() => {
      const now = blitsPlatform.now()
      const fps = Math.round((frames * 1000) / (now - fpsStarted))
      frames = 0
      fpsStarted = now
      if (subs.fpsUpdate.size !== 0) fire('fpsUpdate', facade, { fps })
    }, interval)
    if (typeof fpsTimer.unref === 'function') fpsTimer.unref()
  }

  for (const name of ['contextLost', 'contextRestored', 'contextRestoreFailed']) {
    const sig = app.signals[name]
    if (sig === undefined) continue
    subs[name] = new Set()
    signalUnsubs.push(sig.subscribe((data) => fire(name, facade, data)))
  }

  const facade = {
    _isFtl: true,
    _ftlApp: app,
    canvas,
    root: app.root,
    ready: app.ready,
    start: () => app.start(),
    stop: () => app.stop(),
    setClearColor: (color) => app.setClearColor(color),
    setFpsInterval,
    on: (evt, cb) => {
      if (subs[evt] === undefined) {
        Log.warn(`[Blits:FTL] renderer event '${evt}' is not supported`)
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
      if (destroyed === true) return
      destroyed = true
      if (fpsTimer !== null) clearInterval(fpsTimer)
      for (let i = 0; i < signalUnsubs.length; i++) signalUnsubs[i]()
      signalUnsubs.length = 0
      Object.keys(subs).forEach((k) => subs[k].clear())
      if (onDestroy !== null && onDestroy !== undefined) {
        try {
          onDestroy()
        } catch {
          // ignore teardown errors
        }
      }
      if (app && typeof app.stop === 'function') app.stop()
    },
  }
  setFpsInterval(settings.fpsInterval ?? 1000)
  return facade
}

/**
 * Initialize the FTL engine. The caller owns application construction.
 *
 * @param {HTMLElement|string} target - The target element (or element id) to render into.
 * @param {Partial<import('../../launch.js').BlitsSettings>} [settings] - Blits settings.
 * @returns {Promise<any>} Resolves to the renderer facade.
 */
export default async (target, settings = {}) => {
  const w = settings.w || 1920
  const h = settings.h || 1080
  const renderMode = 'renderMode' in settings ? settings.renderMode : 'webgl'
  if (renderMode !== 'canvas' && renderMode !== 'webgl') {
    throw new Error(`[Blits:FTL] unsupported renderMode '${renderMode}'`)
  }
  const fonts = settings.fonts || []
  let needsMsdf = false
  for (let i = 0; i < fonts.length; i++) {
    if (resolveFontEngine(fonts[i], renderMode).engine === 'msdf') needsMsdf = true
  }

  // Note: all specifiers below are static strings (no @vite-ignore) so Vite
  // can resolve and code-split them. They only load when the FTL engine is
  // selected; L3 apps never fetch these chunks.
  const [{ default: main }, { default: platform }, textCanvas, textMsdf] = await Promise.all([
    import('ftl'),
    import('ftl/platform/browser'),
    import('ftl/text/canvas'),
    needsMsdf === true ? import('ftl/text/msdf') : Promise.resolve(null),
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
  if (renderMode === 'webgl') {
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
      BilinearShader: shaderMods.BilinearShader,
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
      'BilinearShader',
      'HolePunchShader',
    ].map((key) => mods.createShader(mods[key]))
  }

  const targetEl = resolveTarget(target)
  const canvas = resolveCanvas(targetEl, settings, w, h)
  // An app-provided canvas with explicit CSS size keeps it; otherwise Blits
  // fits the backing store to the display (see fitCanvas).
  const appSized =
    settings.canvas !== undefined &&
    settings.canvas.style !== undefined &&
    settings.canvas.style.width !== '' &&
    settings.canvas.style.height !== ''
  let unfit = () => {}
  if (appSized !== true) {
    unfit = fitCanvas(canvas, targetEl, w, h)
  }

  let renderer
  // MSDF text needs its shader program + engine; canvas renderMode has
  // neither (MSDF is WebGL-only) and stays all-canvas.
  let msdfTextShader = null
  if (renderMode === 'canvas') {
    const canvasRenderer = rendererModule.default || rendererModule
    renderer = canvasRenderer(canvas, { sortChildrenByZ: true })
  } else {
    const [{ DefaultRectShader, DefaultTextureShader, MsdfTextShader }, { createShader }] =
      await Promise.all([import('ftl/shaders'), import('ftl/shaders/create')])
    const webglRenderer = rendererModule.default || rendererModule
    msdfTextShader = needsMsdf === true ? createShader(MsdfTextShader) : null
    renderer = webglRenderer(canvas, {
      rectangleShader: createShader(DefaultRectShader),
      textureShader: createShader(DefaultTextureShader),
      msdfTextShader,
      bmfTextShader: null,
      // Pre-inits every module the shader bridge may instantiate later.
      additionalShaders: shaderInstances,
    })
  }

  ftlApp = main({
    platform: settings.rendererPlatform || platform,
    renderer,
    text: {
      canvas: textCanvas.default || textCanvas,
      // MSDF engine coexists with canvas; per-text `type` selects.
      // Default stays canvas (unregistered families fall back, like L3).
      msdf: textMsdf === null ? undefined : textMsdf.default,
      defaultTextEngine: 'canvas',
    },
    config: Object.assign(
      {
        width: w,
        height: h,
        boundsMargin: settings.viewportMargin || 0,
        numImageWorkers:
          settings.webWorkersLimit ?? Math.min(blitsPlatform.hardwareConcurrency || 2, 2),
        uploadBudgetMs: settings.textureProcessingTimeLimit ?? 10,
        clearColor: colorToFtl(settings.canvasColor ?? '0x00000000'),
        handleLoopError: (error) => Log.error('[Blits:FTL] render loop callback failed', error),
      },
      settings.advanced,
      { width: w, height: h }
    ),
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

  let stopAnimations = () => {}
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
    const previousMainLoop = animeEngine.useDefaultMainLoop
    animeEngine.useDefaultMainLoop = false
    ftlApp.addActiveCheck(() => tweenMod.hasRunningTweens())
    const unsubscribe = ftlApp.signals.tick.subscribe(() => {
      try {
        animeEngine.update()
      } catch (e) {
        Log.error('[Blits:FTL] animation engine update failed', e)
      }
    })
    stopAnimations = () => {
      unsubscribe()
      tweenMod.setAnimationEngine(null)
      animeEngine.useDefaultMainLoop = previousMainLoop
    }
  } catch {
    Log.warn(
      '[Blits:FTL] `animejs` peer not installed — transitions apply instantly (`npm i animejs`)'
    )
  }

  // Dev-only handle for debugging (`window.__blitsFtl.root`, `.createElement`,
  // ...). Stripped from production builds by the Blits vite precompiler define.
  if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    window.__blitsFtl = ftlApp
    try {
      const stageModule = await import('ftl/stage')
      const stage = stageModule.getCurrentStage()
      window.__blitsFtl.stage = stage
    } catch {
      // stage handle is best-effort debug only
    }
  }

  // Fonts: `msdf`/`sdf` entries load their atlas pair into the MSDF
  // engine (derived `<file>.msdf.png/.json` unless explicit png/json;
  // the Blits msdfGenerator vite plugin serves/generates those URLs).
  // Everything else loads the raw file into the canvas engine. Families
  // are registered per loaded engine so text nodes select correctly.
  // Current FTL loadFont registers lazily. First use triggers loading and
  // invalidates the element when ready; do not preload every configured font.
  fontEngines.clear()
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i]
    const plan = resolveFontEngine(font, renderMode)
    if (plan.skipped !== undefined) {
      Log.warn(
        `[Blits:FTL] font '${plan.family}' (type '${font.type}') has no loadable font file, using canvas fallback`
      )
      continue
    }
    try {
      if (plan.engine === 'msdf') {
        await ftlApp.loadFont('msdf', {
          family: plan.family,
          atlas: plan.atlas,
          fontData: plan.fontData,
        })
        fontEngines.register(plan.family, 'msdf')
      } else {
        await ftlApp.loadFont('canvas', { family: plan.family, url: plan.url })
        fontEngines.register(plan.family, 'canvas')
      }
    } catch (e) {
      Log.warn(
        `[Blits:FTL] failed to load font '${plan.family}' (${plan.engine}), using canvas fallback`,
        e
      )
      fontEngines.register(plan.family, 'canvas')
    }
  }

  if (settings.shaders && settings.shaders.length > 0) {
    Log.warn('[Blits:FTL] custom shader registration is not supported, ignoring')
  }
  if (settings.effects && settings.effects.length > 0) {
    Log.warn('[Blits:FTL] custom shader effects are not supported, ignoring')
  }
  if (settings.inspector === true) {
    Log.warn('[Blits:FTL] inspector is not supported with FTL')
  }
  for (const key of ['pixelRatio', 'renderQuality', 'screenResolution', 'gpuMemory', 'maxFPS']) {
    if (settings[key] !== undefined)
      Log.warn(`[Blits:FTL] launch setting '${key}' is not supported`)
  }

  rendererFacade = createFacade(ftlApp, canvas, settings, () => {
    unfit()
    stopAnimations()
    if (shaderBridge !== null) {
      shaderBridge.setStage(null)
      shaderBridge.setShaderModules(null)
    }
    fontEngines.clear()
    if (typeof window !== 'undefined' && window.__blitsFtl === ftlApp) {
      window.__blitsFtl = undefined
    }
    ftlApp = null
    rendererFacade = null
  })
  return rendererFacade
}
