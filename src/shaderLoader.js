import Settings from '.settings'
import { renderer } from './launch'

export default () => {
  const stage = renderer.driver.stage
  Settings.get('shaders', []).forEach((shader) => {
    stage.shManager.registerShaderType(shader.name, shader.type)
  })
  Settings.get('shaderEffects', []).forEach((effect) => {
    stage.shManager.registerShaderType(effect.name, effect.type)
  })
}
