const baseProp = {
  cast: (v) => v,
  required: false,
}

export default (component, props = []) => {
  component.___propKeys = []
  props.forEach((prop) => {
    prop = { ...baseProp, ...(typeof prop === 'object' ? prop : { key: prop }) }
    component.___propKeys.push(prop.key)
    Object.defineProperty(component.prototype, prop.key, {
      get() {
        const value = prop.cast(
          this.___props && prop.key in this.___props
            ? this.___props[prop.key]
            : prop.default || undefined
        )

        if (prop.required && value === undefined) {
          console.warn(`${prop.key} is required`)
        }

        return value
      },
      set(v) {
        console.warn(`Warning! Avoid mutating props directly (${prop.key})`)
        this.___props[prop.key] = v
      },
    })
  })
}
