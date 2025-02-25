import Settings from '../../settings.js'
import { renderer } from './launch.js'

function registerBlitsDefaultShaders(
  shManager,
  Rounded,
  RoundedWithBorder,
  RoundedWithShadow,
  RoundedWithBorderAndShadow,
  RadialGradient,
  LinearGradient,
  HolePunch
) {
  shManager.registerShaderType('rounded', Rounded)
  shManager.registerShaderType('roundedWithBorder', RoundedWithBorder)
  shManager.registerShaderType('roundedWithShadow', RoundedWithShadow)
  shManager.registerShaderType('roundedWithBorderAndShadow', RoundedWithBorderAndShadow)
  shManager.registerShaderType('radialGradient', RadialGradient)
  shManager.registerShaderType('linearGradient', LinearGradient)
  shManager.registerShaderType('holePunch', HolePunch)
}

export default async () => {
  const stage = renderer.stage
  const renderMode = Settings.get('renderMode')
  if (renderMode !== undefined && renderMode === 'canvas') {
    const {
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow,
      RadialGradient,
      LinearGradient,
      HolePunch,
    } = await import('@lightningjs/renderer/canvas/shaders')
    registerBlitsDefaultShaders(
      stage.shManager,
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow,
      RadialGradient,
      LinearGradient,
      HolePunch
    )
  } else {
    const {
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow,
      RadialGradient,
      LinearGradient,
      HolePunch,
    } = await import('@lightningjs/renderer/webgl/shaders')
    registerBlitsDefaultShaders(
      stage.shManager,
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow,
      RadialGradient,
      LinearGradient,
      HolePunch
    )
  }

  Settings.get('shaders', []).forEach((shader) => {
    stage.shManager.registerShaderType(shader.name, shader.type)
  })
}
