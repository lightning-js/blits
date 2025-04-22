import Settings from '../../settings.js'
import { renderer } from './launch.js'

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

/**
 * vite does not like dynamic links, this resolves that issue
 */
const shaderModules = {
  webgl: () => import('@lightningjs/renderer/webgl/shaders'),
  canvas: () => import('@lightningjs/renderer/canvas/shaders'),
}

export default async () => {
  const stage = renderer.stage
  const renderMode = Settings.get('renderMode', 'webgl')
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
  } = await shaderModules[renderMode]()

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
