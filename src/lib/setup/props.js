export default (component, props) => {
  component.___propKeys = []
  // note: props can also be an object, with defaults, type, required etc.
  props.forEach((key) => {
    component.___propKeys.push(key)
    Object.defineProperty(component.prototype, key, {
      get() {
        return this.___props && key in this.___props && this.___props[key]
      },
    })
  })
}
