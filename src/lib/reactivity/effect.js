let currentEffect = null
const objectMap = new WeakMap()

export const track = (target, key) => {
  if (currentEffect) {
    let effectsMap = objectMap.get(target)
    if (!effectsMap) {
      effectsMap = new Map()
      objectMap.set(target, effectsMap)
    }
    let effects = effectsMap.get(key)
    if (!effects) {
      effects = new Set()
      effectsMap.set(key, effects)
    }
    effects.add(currentEffect)
  }
}

export const trigger = (target, key) => {
  const effectsMap = objectMap.get(target)
  if (!effectsMap) {
    return
  }
  const effects = effectsMap.get(key)
  if (effects) {
    effects.forEach((effect) => {
      effect()
    })
  }
}

export const effect = (effect) => {
  currentEffect = effect
  currentEffect()
  currentEffect = null
}
