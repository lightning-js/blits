export default (component, state) => {
  component.___stateKeys = []

  state = state.apply(component)
  Object.keys(state).forEach((key) => {
    if (component.___propKeys && component.___propKeys.indexOf(key) > -1) {
      console.error(`State ${key} already exists as a prop`)
    }
    if (component.___methodKeys && component.___methodKeys.indexOf(key) > -1) {
      console.error(`State ${key} already exists as a method`)
    }
    component.___stateKeys.push(key)
    try {
      Object.defineProperty(component.prototype, key, {
        get() {
          return this.___state && key in this.___state && this.___state[key]
        },
        set(v) {
          if (this.___state) this.___state[key] = v
        },
      })
    } catch (e) {
      console.error(e)
    }
  })
}
