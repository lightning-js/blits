import { Log } from '../log.js'

export default (component, methods) => {
  component.___methodsKeys = []

  for (let method in methods) {
    // test for reserved keys?
    if (component.___propKeys && component.___propKeys.indexOf(method) > -1) {
      Log.error(`${method} already exists as a prop`)
    } else {
      if (typeof methods[method] !== 'function') {
        Log.warn(`${method} is not a function`)
      }
      component.___methodsKeys.push(method)
      component.prototype[method] = methods[method]
    }
  }
}
