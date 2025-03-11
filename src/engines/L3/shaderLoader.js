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
    RoundedWithBorder,
    RoundedWithShadow,
    RoundedWithBorderAndShadow,
    RadialGradient,
    LinearGradient,
    HolePunch,
  } = await shaderModules[renderMode]()

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

  const shaders = Settings.get('shaders', [])
  const len = shaders.length
  for (let i = 0; i < len; i++) {
    stage.shManager.registerShaderType(shaders[i].name, shaders[i].type)
  }
}
