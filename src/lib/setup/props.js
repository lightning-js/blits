import { Log } from '../log.js'

const baseProp = {
  cast: (v) => v,
  required: false,
}

export default (component, props = []) => {
  if (props.indexOf('id') === -1) {
    props.push('id')
  }
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
          Log.warn(`${prop.key} is required`)
        }

        return value
      },
      set(v) {
        Log.warn(`Warning! Avoid mutating props directly (${prop.key})`)
        this.___props[prop.key] = v
      },
    })
  })
}
