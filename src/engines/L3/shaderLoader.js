import Settings from '../../settings.js'
import { renderer } from './launch.js'

export default () => {
  const stage = renderer.stage
  Settings.get('shaders', []).forEach((shader) => {
    stage.shManager.registerShaderType(shader.name, shader.type)
  })
  Settings.get('effects', []).forEach((effect) => {
    stage.shManager.registerShaderType(effect.name, effect.type)
  })
}
