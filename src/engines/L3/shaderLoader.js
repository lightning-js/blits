import Settings from '../../settings.js'
import { renderer } from './launch.js'

function registerBlitsDefaultShaders(
  shManager,
  Rounded,
  RoundedWithBorder,
  RoundedWithShadow,
  RoundedWithBorderAndShadow
) {
  shManager.registerShaderType('Rounded', Rounded)
  shManager.registerShaderType('RoundedWithBorder', RoundedWithBorder)
  shManager.registerShaderType('RoundedWithShadow', RoundedWithShadow)
  shManager.registerShaderType('RoundedWithBorderAndShadow', RoundedWithBorderAndShadow)
}

export default async () => {
  const stage = renderer.stage
  const renderMode = Settings.get('renderMode')
  if (renderMode !== undefined && renderMode === 'canvas') {
    const { Rounded, RoundedWithBorder, RoundedWithShadow, RoundedWithBorderAndShadow } =
      await import('@lightningjs/renderer/canvas/shaders')
    registerBlitsDefaultShaders(
      stage.shManager,
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow
    )
  } else {
    const { Rounded, RoundedWithBorder, RoundedWithShadow, RoundedWithBorderAndShadow } =
      await import('@lightningjs/renderer/webgl/shaders')
    registerBlitsDefaultShaders(
      stage.shManager,
      Rounded,
      RoundedWithBorder,
      RoundedWithShadow,
      RoundedWithBorderAndShadow
    )
  }

  Settings.get('shaders', []).forEach((shader) => {
    stage.shManager.registerShaderType(shader.name, shader.type)
  })
}
