import { reactive } from '../lib/reactivity/reactive.js'
import { Log } from '../lib/log'

const deepAssign = (current, target) => {
  const keys = Object.keys(target)
  const l = keys.length
  for (let i = 0; i < l; i++) {
    const key = keys[i]
    if (typeof target[key] === 'object') {
      deepAssign(current[key], target[key])
    } else {
      current[key] = target[key]
    }
  }
}

const cloneObj = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

export default {
  name: 'theme2',
  plugin(config = {}) {
    const base = config.base || config
    const themes = config.themes || {}
    const appliedThemes = []

    const state = Object.assign({}, cloneObj(base), {
      applyTheme(theme) {
        if (theme in themes) {
          if (appliedThemes.indexOf(theme) === -1) {
            appliedThemes.push(theme)
            deepAssign(this, cloneObj(themes[theme]))
          }
        } else {
          Log.warn(`Theme ${theme} not found`)
        }
      },
      removeTheme(theme) {
        const indexOf = appliedThemes.indexOf(theme)
        if (indexOf > -1) {
          appliedThemes.splice(indexOf, 1)
          const l = appliedThemes.length
          const tmpBase = cloneObj(base)
          for (let i = 0; i < l; i++) {
            deepAssign(tmpBase, cloneObj(themes[appliedThemes[i]]))
          }
          deepAssign(this, tmpBase)
        }
      },
    })

    return reactive(state)
  },
}
