import Settings from '../../settings.js'
import { renderer } from './launch.js'
import * as webglShaders from '@lightningjs/renderer/webgl/shaders'
import * as canvasShaders from '@lightningjs/renderer/canvas/shaders'

function registerBlitsDefaultShaders(
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
) {
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

export default () => {
  const stage = renderer.stage

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
  } = Settings.get('renderMode', 'webgl') === 'webgl' ? webglShaders : canvasShaders

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
