export default (component, computeds) => {
  component.___computedKeys = []

  for (let computed in computeds) {
    // test for reserved keys?
    if (component.___propKeys && component.___propKeys.indexOf(computed) > -1) {
      console.error(`${computed} already exists as a prop`)
    } else if (component.___methodKeys && component.___methodKeys.indexOf(computed) > -1) {
      console.error(`${computed} already exists as a method`)
    } else {
      if (typeof computeds[computed] !== 'function') {
        console.warn(`${computed} is not a function`)
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
