/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

export { default as L3 } from './L3/index.js'

/**
 * Select an engine by name. `'l3'` (default) keeps the current behavior;
 * `'ftl'` selects the FTL renderer (phase-1 core-only, see FTL/README-FTL.md).
 * Resolved via dynamic import so the L3 bundle never includes FTL code.
 * Unknown names fall back to L3 with a console warning so a typo never
 * silently boots the wrong renderer.
 */
export const selectEngine = async (name) => {
  if (name === 'ftl') {
    const { default: FTL } = await import('./FTL/index.js')
    return FTL
  }
  if (name !== undefined && name !== null && name !== 'l3') {
    console.warn(`[Blits] unknown renderer '${name}', falling back to 'l3'`)
  }
  const { default: L3 } = await import('./L3/index.js')
  return L3
}
