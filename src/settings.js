const settings = {
  ___settings: {},
  get(key, defaultValue = null) {
    return (key in this.___settings && this.___settings[key]) || defaultValue
  },
  set(key, value) {
    if (typeof key === 'object') {
      Object.keys(key).forEach((k) => {
        this.set(k, key[k])
      })
    } else {
      this.___settings[key] = value
    }
  },
}

export default settings
