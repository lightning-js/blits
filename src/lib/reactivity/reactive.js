import { track, trigger } from './effect.js'

const reactiveProxy = (target) => {
  const handler = {
    get(target, key, receiver) {
      let result = Reflect.get(target, key, receiver)

      // can be improved
      if (typeof target[key] === 'object') {
        return reactiveProxy(target[key])
      }

      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      let oldValue = target[key]
      let result = Reflect.set(target, key, value, receiver)
      if (result && oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
  }
  return new Proxy(target, handler)
}

const reactiveDefineProperty = (target) => {
  Object.keys(target).forEach((key) => {
    let internalValue = target[key]

    // can be improved
    if (typeof target[key] === 'object') {
      return reactiveDefineProperty(target[key])
    }

    Object.defineProperty(target, key, {
      enumerable: true, // ?
      configurable: true, // ?
      get() {
        track(target, key)
        return internalValue
      },
      set(newValue) {
        let oldValue = internalValue
        if (oldValue !== newValue) {
          internalValue = newValue
          trigger(target, key)
        }
      },
    })
  })

  return target
}

// maybe an options object?
export const reactive = (target, type = 'proxy') => {
  return type === 'proxy' ? reactiveProxy(target) : reactiveDefineProperty(target)
}

export const memo = (raw) => {
  const r = {
    get value() {
      track(r, 'value')
      return raw
    },
    set value(v) {
      raw = v
      trigger(r, 'value')
    },
  }
  return r
}
