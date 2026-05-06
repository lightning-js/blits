import Settings from '../../settings.js'
import { renderer } from './launch.js'

const blitsDefaultShaderNames = [
  'Rounded',
  'Border',
  'Shadow',
  'RoundedWithBorder',
  'RoundedWithShadow',
  'RoundedWithBorderAndShadow',
  'HolePunch',
  'RadialGradient',
  'LinearGradient',
]

const blitsShaderTypeNames = [
  'rounded',
  'border',
  'shadow',
  'roundedWithBorder',
  'roundedWithShadow',
  'roundedWithBorderAndShadow',
  'holePunch',
  'radialGradient',
  'linearGradient',
]

const loadShadersV3 = (stage, shaderModule) => {
  for (let i = 0; i < blitsDefaultShaderNames.length; i++) {
    const shader = shaderModule[blitsDefaultShaderNames[i]]
    if (shader) {
      stage.shManager.registerShaderType(blitsShaderTypeNames[i], shader)
    }
  }

  const shaders = Settings.get('shaders', [])
  for (let i = 0; i < shaders.length; i++) {
    stage.shManager.registerShaderType(shaders[i].name, shaders[i].type)
  }
}

const loadShadersV2 = (stage) => {
  const shaders = Settings.get('shaders', [])
  for (let i = 0; i < shaders.length; i++) {
    stage.shManager.registerShaderType(shaders[i].name, shaders[i].type)
  }

  const effects = Settings.get('effects', [])
  for (let i = 0; i < effects.length; i++) {
    stage.shManager.registerShaderType(effects[i].name, effects[i].type)
  }
}

export default (rendererWebgl) => {
  const stage = renderer.stage

  // v3 has a `shaders` namespace on the webgl module; v2 does not
  if (rendererWebgl && rendererWebgl.shaders) {
    const renderMode = Settings.get('renderMode', 'webgl')
    if (renderMode === 'canvas') {
      const canvasShaderPath = '@lightningjs/renderer' + '/canvas/shaders'
      import(/* @vite-ignore */ canvasShaderPath).then((canvasShaders) => {
        loadShadersV3(stage, canvasShaders)
      })
    } else {
      loadShadersV3(stage, rendererWebgl.shaders)
    }
  } else {
    loadShadersV2(stage)
  }
}
