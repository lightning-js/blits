import lng from '../../node_modules/@lightningjs/core/index.js'

export let stage
export let wrapper

export default (config) => {

  stage = new lng.Stage(config)

  wrapper = new lng.Element(stage)

  // quick hack :)
  wrapper.getOption = () => {}

  // wrapper will end up being root
  stage.setApplication(wrapper)
  stage.init()

  return {
    stage, wrapper
  }
}
