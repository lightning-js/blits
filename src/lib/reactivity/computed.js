import { memo } from './reactive.js'
import { effect } from './effect.js'

export const computed = (getter) => {
  let result = memo(getter)
  effect(() => (result.value = getter()))
  return result
}
