import { Log } from '../log.js'

export default (component, input) => {
  component.prototype.___inputEvents = []
  Object.keys(input).forEach((key) => {
    if (typeof input[key] !== 'function') {
      Log.warn(`${input[key]} is not a function`)
    }
    component.prototype.___inputEvents[key] = input[key]
  })
}
