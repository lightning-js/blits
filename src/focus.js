let focusedComponent = null

export default {
  get() {
    return focusedComponent
  },
  set(v) {
    // console.log('set focus to', v.componentId)
    focusedComponent = v
  },
  input(key, event) {
    const focusChain = walkChain([focusedComponent], key)
    const componentWithInputEvent = focusChain.shift()

    if (componentWithInputEvent) {
      if (componentWithInputEvent !== focusedComponent) {
        focusChain.reverse().forEach((component) => component.unfocus())
        componentWithInputEvent.focus()
      }
      focusedComponent.___inputEvents[key].apply(focusedComponent, event)
    }
  },
}

const walkChain = (components, key) => {
  if (components[0].___inputEvents && typeof components[0].___inputEvents[key] === 'function') {
    return components
  } else if (components[0].parent) {
    components.unshift(components[0].parent)
    return walkChain(components, key)
  } else return []
}
