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

// Blits→FTL shader bridge (built-ins only). Translates Blits element props
// (`rounded`/`border`/`shadow`, gradient `color` objects, `shader={type}`
// for built-in types) into FTL shader instances (`el.shader`).
//
// Notes:
// - The value parsers are ported from `src/lib/shaders/shaders.js` rather
//   than imported: that module pulls the L3 renderer singleton, which would
//   bundle the whole L3 renderer into the FTL chunk.
// - Colors are normalized with the shared `colors` lib, then converted to
//   FTL `[r,g,b,a]` floats. `colorToFtl` is exported for `element.js`.
// - Gradient angle convention needs NO translation: both L3
//   (`props.angle - PI/2`) and FTL (`shader.angle - 90°` in prepareElement)
//   treat the Blits angle identically (radians).
// - Custom `shaders:[]` types stay out of scope (warn in element.js).
// - FTL shader modules are injected (`setShaderModules`) so tests run
//   without the `ftl` package. Same for the stage handle (`setStage`).

import { Log } from '../../lib/log.js'
import colors from '../../lib/colors/colors.js'
import { parseToObject, isObjectString, isArrayString } from '../../lib/utils.js'

const warned = {}
const warnOnce = (key, msg) => {
  if (warned[key] === true) return
  warned[key] = true
  Log.warn(`[Blits:FTL] ${msg}`)
}

/** @type {any|null} Injected FTL shader modules + createShader. */
let shaderModules = null

/** @type {any|null} Injected FTL stage (for shader bucket re-listing). */
let stageRef = null

/**
 * Inject FTL shader modules (production: resolved in launch.js via
 * dynamic `import('ftl/shaders')` + `import('ftl/shaders/create')`).
 */
export const setShaderModules = (mods) => {
  shaderModules = mods
}

/** Inject the FTL stage for bucket re-listing on shader null<->set switches. */
export const setStage = (stage) => {
  stageRef = stage
}

/**
 * Convert a Blits color (any `colors.normalize` format incl. normalized
 * `0xRRGGBBAA` strings and numbers) to FTL `[r,g,b,a]` floats.
 * @param {any} v
 * @returns {number[]}
 */
export const colorToFtl = (v) => {
  if (v === null || v === undefined) return [1, 1, 1, 1]
  const normalized = colors.normalize(typeof v === 'string' ? v : '' + v)
  const hex = ('' + normalized).replace('0x', '').replace('#', '')
  if (/^[0-9a-f]{8}$/i.test(hex) === false) return [1, 1, 1, 1]
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
    parseInt(hex.slice(6, 8), 16) / 255,
  ]
}

/**
 * Parse a `rounded` value to number | [tl,tr,br,bl] | null.
 * Object forms have no FTL equivalent (warn once).
 */
export const parseRoundedValue = (v) => {
  if (v === undefined || v === null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    if (isArrayString(v) === true) return JSON.parse(v)
    if (isObjectString(v) === true) {
      warnOnce('rounded-object', "'rounded' object form is not supported in FTL, ignoring")
      return null
    }
    const n = parseFloat(v)
    return Number.isNaN(n) === false ? n : null
  }
  if (Array.isArray(v) === true) return v
  if (typeof v === 'object') {
    warnOnce('rounded-object', "'rounded' object form is not supported in FTL, ignoring")
    return null
  }
  return null
}

/**
 * Parse a `border` value to `{ width, color, gap, align }` (all optional).
 * Mirrors `lib/shaders/shaders.js` `parseBorder`.
 */
export const parseBorderValue = (v) => {
  if (v === undefined || v === null) return null
  if (typeof v === 'number') return { width: v }
  if (typeof v === 'string') {
    if (isArrayString(v) === true) return { width: JSON.parse(v) }
    if (isObjectString(v) === true) v = parseToObject(v)
    else {
      const n = parseFloat(v)
      if (Number.isNaN(n) === false) return { width: n }
      return null
    }
  }
  if (Array.isArray(v) === true) return { width: v }
  if (typeof v === 'object') {
    const out = {}
    if ('w' in v === true) out.width = v.w
    if ('width' in v === true) out.width = v.width
    if ('color' in v === true) out.color = colorToFtl(v.color)
    if ('gap' in v === true) out.gap = v.gap
    if ('align' in v === true) out.align = v.align
    return out
  }
  return null
}

/**
 * Parse a `shadow` value to `{ color, projection }` where
 * `projection = [offsetX, offsetY, blur, spread]`.
 * Base projection `[0,0,5,5]` mirrors the L3 `ShadowTemplate` default;
 * `x/y/blur/spread` keys patch individual channels like L3 setters do.
 */
export const parseShadowValue = (v) => {
  if (v === undefined || v === null) return null
  if (typeof v === 'string') {
    if (isArrayString(v) === true) return { projection: JSON.parse(v) }
    if (isObjectString(v) === true) v = parseToObject(v)
    else return null
  }
  if (Array.isArray(v) === true) return { projection: v }
  if (typeof v === 'object') {
    if (Array.isArray(v.projection) === true) {
      const out = { projection: v.projection.slice(0, 4) }
      if ('color' in v === true) out.color = colorToFtl(v.color)
      return out
    }
    const projection = [0, 0, 5, 5]
    if ('x' in v === true) projection[0] = v.x
    if ('y' in v === true) projection[1] = v.y
    if ('blur' in v === true) projection[2] = v.blur
    if ('spread' in v === true) projection[3] = v.spread
    const out = { projection }
    if ('color' in v === true) out.color = colorToFtl(v.color)
    return out
  }
  return null
}

// Corner vectors in screen space (y down) for gradient color objects.
const gradientCorners = {
  top: [0, -1],
  bottom: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/**
 * Translate a gradient `color` object (`{top,bottom,left,right}`, any subset)
 * to `{ colors, stops, angle }` for the FTL LinearGradientShader.
 * - Axis pairs map exactly (left->right angle 0, top->bottom PI/2).
 * - Corner pairs map to the diagonal angle (approximation of L3's bilinear
 *   4-corner blend — visually close, documented).
 * - A single key degrades to a solid color (returned as `solid`).
 * @param {object} obj
 * @returns {{ solid?: number[], colors?: number[][], stops?: number[], angle?: number }|null}
 */
export const parseGradientColor = (obj) => {
  if (obj === undefined || obj === null || typeof obj !== 'object') return null
  const keys = Object.keys(obj).filter((k) => gradientCorners[k] !== undefined)
  if (keys.length === 0) {
    warnOnce('gradient-keys', 'gradient color needs top/bottom/left/right keys, ignoring')
    return null
  }
  if (keys.length === 1) {
    return { solid: colorToFtl(obj[keys[0]]) }
  }
  const first = keys[0]
  const last = keys[keys.length - 1]
  const dx = gradientCorners[last][0] - gradientCorners[first][0]
  const dy = gradientCorners[last][1] - gradientCorners[first][1]
  const colors = keys.map((k) => colorToFtl(obj[k]))
  const stops = keys.map((_, i) => (keys.length === 1 ? 0 : i / (keys.length - 1)))
  // FTL geometry: dist grows along gradVec = (-cos A, -sin A) with
  // A = angle - 90° (screen coords, y down). Solving gradVec ~ (dx, dy) for
  // the desired start->end direction gives angle = atan2(-dy, -dx) + PI/2
  // (verified: angle 0 = top->bottom, PI/2 mirrored = right->left),
  // normalized to [0, 2PI) for stable tests and uniforms.
  const tau = Math.PI * 2
  const raw = Math.atan2(-dy, -dx) + Math.PI / 2
  return { colors, stops, angle: ((raw % tau) + tau) % tau }
}

/**
 * Combination matrix mirroring `lib/shaders/shaders.js createElementShader`:
 * border+shadow (no rounded) and every rounded combo share the
 * `roundedWithBorderAndShadow` FTL shader (radius 0 when unrounded).
 * @param {{ rounded: any, border: any, shadow: any }} raw
 * @returns {{ kind: string, fields: object }|null}
 */
export const buildElementShader = (raw) => {
  const rounded = parseRoundedValue(raw.rounded)
  const border = parseBorderValue(raw.border)
  const shadow = parseShadowValue(raw.shadow)
  const hasRounded = rounded !== null
  const hasBorder = border !== null
  const hasShadow = shadow !== null
  if (hasRounded === false && hasBorder === false && hasShadow === false) return null

  if (hasRounded === true && (hasBorder === true || hasShadow === true)) {
    if (hasBorder === true && hasShadow === true) {
      return {
        kind: 'roundedWithBorderAndShadow',
        fields: {
          radius: rounded,
          borderWidth: border.width !== undefined ? border.width : 0,
          ...(border.color !== undefined ? { borderColor: border.color } : {}),
          ...(border.gap !== undefined ? { borderGap: border.gap } : {}),
          ...(border.align !== undefined ? { borderAlign: border.align } : {}),
          ...(shadow.color !== undefined ? { shadowColor: shadow.color } : {}),
          shadow: shadow.projection !== undefined ? shadow.projection : [0, 0, 5, 5],
        },
      }
    }
    if (hasBorder === true) {
      return {
        kind: 'roundedWithBorder',
        fields: {
          radius: rounded,
          borderWidth: border.width !== undefined ? border.width : 0,
          ...(border.color !== undefined ? { borderColor: border.color } : {}),
          ...(border.gap !== undefined ? { borderGap: border.gap } : {}),
          ...(border.align !== undefined ? { borderAlign: border.align } : {}),
        },
      }
    }
    return {
      kind: 'roundedWithShadow',
      fields: {
        radius: rounded,
        ...(shadow.color !== undefined ? { shadowColor: shadow.color } : {}),
        shadow: shadow.projection !== undefined ? shadow.projection : [0, 0, 5, 5],
      },
    }
  }

  if (hasRounded === true) {
    return { kind: 'rounded', fields: { radius: rounded } }
  }
  if (hasBorder === true && hasShadow === true) {
    // L3 uses the roundedWithBorderAndShadow key for this combo too.
    return {
      kind: 'roundedWithBorderAndShadow',
      fields: {
        radius: 0,
        borderWidth: border.width !== undefined ? border.width : 0,
        ...(border.color !== undefined ? { borderColor: border.color } : {}),
        ...(border.gap !== undefined ? { borderGap: border.gap } : {}),
        ...(border.align !== undefined ? { borderAlign: border.align } : {}),
        ...(shadow.color !== undefined ? { shadowColor: shadow.color } : {}),
        shadow: shadow.projection !== undefined ? shadow.projection : [0, 0, 5, 5],
      },
    }
  }
  if (hasBorder === true) {
    return {
      kind: 'border',
      fields: {
        ...(border.width !== undefined ? { width: border.width } : {}),
        ...(border.color !== undefined ? { color: border.color } : {}),
        ...(border.gap !== undefined ? { gap: border.gap } : {}),
        ...(border.align !== undefined ? { align: border.align } : {}),
      },
    }
  }
  return {
    kind: 'shadow',
    fields: {
      ...(shadow.color !== undefined ? { color: shadow.color } : {}),
      ...(shadow.projection !== undefined ? { projection: shadow.projection } : {}),
    },
  }
}

/** Blits `shader={type}` names for built-in types -> bridge kinds. */
const customTypeToKind = {
  linearGradient: 'linearGradient',
  radialGradient: 'radialGradient',
  holePunch: 'holePunch',
  rounded: 'rounded',
  border: 'border',
  shadow: 'shadow',
  roundedWithBorder: 'roundedWithBorder',
  roundedWithShadow: 'roundedWithShadow',
  roundedWithBorderAndShadow: 'roundedWithBorderAndShadow',
}

/**
 * Translate a `shader={type, ...props}` object for a BUILT-IN type.
 * Returns null (with warn) for custom/unknown types (out of scope).
 * @param {object} props - Parsed shader props incl. `type`.
 * @returns {{ kind: string, fields: object }|null}
 */
export const buildCustomShader = (props) => {
  if (props === undefined || props === null || typeof props !== 'object') return null
  const kind = customTypeToKind[props.type]
  if (kind === undefined) {
    warnOnce(
      'shader-custom',
      `custom shader type '${props.type}' needs a hand port to FTL (phase 2+), ignoring`
    )
    return null
  }
  // Strip Blits flat-prefix and alias forms to canonical FTL field names.
  const fields = {}
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key === 'type') continue
    if (key === 'width' && kind === 'holePunch') {
      fields.w = props[key]
      continue
    }
    if (key === 'height' && kind === 'holePunch') {
      fields.h = props[key]
      continue
    }
    let outKey = key
    if (key === 'w' && (kind === 'border' || kind.indexOf('Border') !== -1)) {
      outKey = kind === 'border' ? 'width' : 'borderWidth'
    }
    if (key.indexOf('border-') === 0)
      outKey = 'border' + key.slice(7, 8).toUpperCase() + key.slice(8)
    if (key.indexOf('shadow-') === 0)
      outKey = 'shadow' + key.slice(7, 8).toUpperCase() + key.slice(8)
    if (outKey === 'borderWidth' && kind === 'border') outKey = 'width'
    if (outKey === 'borderColor' && kind === 'border') outKey = 'color'
    if (outKey === 'borderGap' && kind === 'border') outKey = 'gap'
    if (outKey === 'borderAlign' && kind === 'border') outKey = 'align'
    if (outKey === 'shadowColor' && kind === 'shadow') outKey = 'color'
    if ((outKey === 'color' || outKey === 'colors') && props[key] !== undefined) {
      fields[outKey] = Array.isArray(props[key])
        ? props[key].map((c) => (Array.isArray(c) ? c : colorToFtl(c)))
        : colorToFtl(props[key])
      continue
    }
    fields[outKey] = props[key]
  }
  // Gradient sanity: 2..8 colors, matching stops.
  if ((kind === 'linearGradient' || kind === 'radialGradient') && Array.isArray(fields.colors)) {
    if (fields.colors.length < 2) {
      warnOnce('gradient-stops', 'gradients need at least 2 colors, ignoring')
      return null
    }
    if (fields.colors.length > 8) {
      warnOnce('gradient-stops', 'FTL supports max 8 gradient stops, truncating')
      fields.colors = fields.colors.slice(0, 8)
    }
    if (Array.isArray(fields.stops) === false || fields.stops.length !== fields.colors.length) {
      fields.stops = fields.colors.map((_, i) => i / (fields.colors.length - 1))
    }
  }
  return { kind, fields }
}

/** Bridge kind -> FTL shader module key (keys of the injected modules map). */
const kindToModule = {
  rounded: 'RoundedShader',
  border: 'BorderShader',
  shadow: 'ShadowShader',
  roundedWithBorder: 'RoundedWithBorderShader',
  roundedWithShadow: 'RoundedWithShadowShader',
  roundedWithBorderAndShadow: 'RoundedWithBorderAndShadowShader',
  linearGradient: 'LinearGradientShader',
  radialGradient: 'RadialGradientShader',
  holePunch: 'HolePunchShader',
}

/**
 * Instantiate a bridge shader description. Throws a loud error when FTL
 * modules are not injected (unit-test escape hatch documents itself).
 * @param {{ kind: string, fields: object }|null} desc
 * @returns {any|null} FTL shader instance or null.
 */
export const createShaderInstance = (desc) => {
  if (desc === null || desc === undefined) return null
  if (shaderModules === null || shaderModules === undefined) {
    throw new Error('[Blits:FTL] shader modules not injected (launch wires them)')
  }
  const moduleKey = kindToModule[desc.kind]
  if (moduleKey === undefined || shaderModules[moduleKey] === undefined) {
    warnOnce('shader-kind', `no FTL shader for kind '${desc.kind}', ignoring`)
    return null
  }
  const instance = shaderModules.createShader(shaderModules[moduleKey])
  const fields = desc.fields || {}
  const keys = Object.keys(fields)
  for (let i = 0; i < keys.length; i++) {
    instance[keys[i]] = fields[keys[i]]
  }
  return instance
}

/**
 * Assign a shader instance with explicit z-bucket re-listing on null<->set
 * switches (`dirty.js` doesn't watch `shader`, so `dirty()` alone would
 * leave the element in the wrong bucket: shader elements render from
 * bucket 3, plain ones from 0/1/2).
 * Type switches (shader->shader) stay in bucket 3: plain assign + dirty.
 * @param {any} el - FTL element.
 * @param {any|null} instance - FTL shader instance or null.
 */
export const assignShader = (el, instance) => {
  const had = el.shader !== null && el.shader !== undefined
  const has = instance !== null && instance !== undefined
  const wasBucketed = el._bucketRenderType !== null && el._bucketRenderType !== undefined
  if (stageRef !== null && wasBucketed === true && had !== has) {
    stageRef.removeFromZIndex(el)
    el.shader = instance
    stageRef.addToZIndex(el)
  } else {
    el.shader = instance
  }
  el.dirty()
}
