/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

import Settings from '../../settings.js'
import { renderer } from './launch.js'

const registerBlitsDefaultShaders = (
  shManager,
  Rounded,
  Border,
  Shadow,
  RoundedWithBorder,
  RoundedWithShadow,
  RoundedWithBorderAndShadow,
  HolePunch,
  RadialGradient,
  LinearGradient
) => {
  shManager.registerShaderType('rounded', Rounded)
  shManager.registerShaderType('border', Border)
  shManager.registerShaderType('shadow', Shadow)
  shManager.registerShaderType('roundedWithBorder', RoundedWithBorder)
  shManager.registerShaderType('roundedWithShadow', RoundedWithShadow)
  shManager.registerShaderType('roundedWithBorderAndShadow', RoundedWithBorderAndShadow)
  shManager.registerShaderType('holePunch', HolePunch)
  shManager.registerShaderType('radialGradient', RadialGradient)
  shManager.registerShaderType('linearGradient', LinearGradient)
}

export default async () => {
  const stage = renderer.stage

  // Load only the shader bundle for the configured renderMode
  const backendShaders =
    Settings.get('renderMode', 'webgl') === 'webgl'
      ? await import('@lightningjs/renderer/webgl/shaders')
      : await import('@lightningjs/renderer/canvas/shaders')

  const {
    Rounded,
    Border,
    Shadow,
    RoundedWithBorder,
    RoundedWithShadow,
    RoundedWithBorderAndShadow,
    HolePunch,
    RadialGradient,
    LinearGradient,
  } = backendShaders

  registerBlitsDefaultShaders(
    stage.shManager,
    Rounded,
    Border,
    Shadow,
    RoundedWithBorder,
    RoundedWithShadow,
    RoundedWithBorderAndShadow,
    HolePunch,
    RadialGradient,
    LinearGradient
  )

  const shaders = Settings.get('shaders', [])
  const len = shaders.length
  for (let i = 0; i < len; i++) {
    stage.shManager.registerShaderType(shaders[i].name, shaders[i].type)
  }
}
