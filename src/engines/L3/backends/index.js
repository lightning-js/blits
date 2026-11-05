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

import { WebGlCoreRenderer, SdfTextRenderer } from '@lightningjs/renderer/webgl'
import { CanvasCoreRenderer, CanvasTextRenderer } from '@lightningjs/renderer/canvas'
import * as webglShaders from '@lightningjs/renderer/webgl/shaders'
import * as canvasShaders from '@lightningjs/renderer/canvas/shaders'

/** @type {'webgl'|'canvas'|null} */
export const lockedRenderMode = null

export const coreRenderers = { webgl: WebGlCoreRenderer, canvas: CanvasCoreRenderer }
export const textRenderers = { Sdf: SdfTextRenderer, Canvas: CanvasTextRenderer }
export const shaderSets = { webgl: webglShaders, canvas: canvasShaders }

export const resolveRenderMode = (requested) =>
  lockedRenderMode !== null ? lockedRenderMode : requested
