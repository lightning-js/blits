import { Log } from '../log.js'

export default (component, computeds) => {
  component.___computedKeys = []

  for (let computed in computeds) {
    // test for reserved keys?
    if (component.___stateKeys && component.___stateKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (component.___propKeys && component.___propKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a prop`)
    } else if (component.___methodKeys && component.___methodKeys.indexOf(computed) > -1) {
      Log.error(`${computed} already exists as a method`)
    } else {
      if (typeof computeds[computed] !== 'function') {
        Log.warn(`${computed} is not a function`)
      }
      component.___computedKeys.push(computed)
      Object.defineProperty(component.prototype, computed, {
        get() {
          return computeds[computed].apply(this)
        },
      })
    }
  }
}
