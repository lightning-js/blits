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

// Font plumbing for the FTL engine: maps Blits font entries onto FTL text
// engines and tracks family->engine so text nodes select the right engine.
// Pure + unit-tested; `launch.js` populates the registry, `element.js` reads.
//
// Blits entry: {family, type: 'web'|'canvas'|'msdf'|'sdf', file?, json?, png?}
// FTL needs: canvas -> loadFont('canvas', {family, url: file});
//            msdf   -> loadFont('msdf', {family, atlas, fontData}).
// Atlas derivation mirrors L3 (`fontLoader.js`): explicit png/json win,
// otherwise `<file base>.msdf.<png|json>`. Both Blits `msdf` and `sdf`
// target the FTL msdf engine (the generator emits MSDF format); MSDF is
// WebGL-only, so `renderMode: 'canvas'` stays all-canvas.

/**
 * Derive an MSDF asset URL from a font file (L3 convention).
 * @param {string|undefined} file - Font file URL, e.g. 'fonts/Lato.ttf'.
 * @param {string} ext - Target extension, e.g. '.msdf.png'.
 * @returns {string|undefined} Derived URL or undefined when no file.
 */
export const deriveMsdfAsset = (file, ext) => {
  if (file === undefined || file === null || file === '') return undefined
  return ('' + file).replace(/\.[^.]+$/, ext)
}

/**
 * Resolve a Blits font entry to an FTL load plan. Pure: no loading here.
 * @param {object} font - Blits font entry.
 * @param {string} [renderMode='webgl'] - Blits renderMode setting.
 * @returns {{ engine: 'msdf'|'canvas', family: string, atlas?: string, fontData?: string, url?: string, skipped?: string }}
 *   `skipped` names the reason when neither engine can serve the entry.
 */
export const resolveFontEngine = (font, renderMode = 'webgl') => {
  const family = font !== undefined && font !== null ? font.family : undefined
  const type = font !== undefined && font !== null ? font.type : undefined
  if ((type === 'msdf' || type === 'sdf') && renderMode !== 'canvas') {
    const atlas = font.png !== undefined ? font.png : deriveMsdfAsset(font.file, '.msdf.png')
    const fontData = font.json !== undefined ? font.json : deriveMsdfAsset(font.file, '.msdf.json')
    if (atlas !== undefined && fontData !== undefined) {
      return { engine: 'msdf', family, atlas, fontData }
    }
    // No atlas pair: fall through to a canvas attempt below (works when a
    // font file is present; otherwise the caller warns + skips).
  }
  const url = font !== undefined && font !== null ? font.file || font.url : undefined
  if (url !== undefined && /\.(ttf|otf|woff2?|eot)(\?.*)?$/i.test(url)) {
    return { engine: 'canvas', family, url }
  }
  return { engine: 'canvas', family, skipped: 'no-loadable-file' }
}

/**
 * Family->engine registry, shared launch.js -> element.js.
 * @returns {{ register: (family: string, engine: string) => void, engineOf: (family: string|undefined) => string|undefined, clear: () => void }}
 */
export const createFontRegistry = () => {
  const map = {}
  return {
    register(family, engine) {
      if (family !== undefined && family !== null) map[family] = engine
    },
    engineOf(family) {
      return family !== undefined && family !== null ? map[family] : undefined
    },
    clear() {
      for (const key in map) delete map[key]
    },
  }
}

/** Live registry singleton (populated by launch, read by element). */
export const fontEngines = createFontRegistry()

/** FTL numeric text type per engine name (mirrors FTL textTypes). */
export const engineTextType = {
  canvas: 0,
  msdf: 1,
}
