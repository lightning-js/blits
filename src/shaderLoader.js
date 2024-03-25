import Settings from './settings'
import { renderer } from './launch'

export default () => {
  console.log('load shaders')
  const stage = renderer.driver.stage
  Settings.get('shaders', []).forEach((shader) => {
    stage.shManager.registerShaderType(shader.name, shader.type)
  })
  Settings.get('shaderEffects', []).forEach((effect) => {
    stage.shManager.registerEffectType(effect.name, effect.type)
  })
}
