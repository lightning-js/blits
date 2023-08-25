let focusedComponent = null

export default {
  get() {
    return focusedComponent
  },
  set(component, event) {
    if (component !== focusedComponent) {
      if (focusedComponent && focusedComponent !== component.parent) {
        focusedComponent.unfocus()
      }
      focusedComponent = component
      focusedComponent.lifecycle.state = 'focus'
      if (event instanceof KeyboardEvent) {
        document.dispatchEvent(new KeyboardEvent('keydown', event))
      }
    }
  },
  input(key, event) {
    const focusChain = walkChain([focusedComponent], key)
    const componentWithInputEvent = focusChain.shift()

    if (componentWithInputEvent) {
      if (componentWithInputEvent !== focusedComponent) {
        focusChain.reverse().forEach((component) => component.unfocus())
        componentWithInputEvent.focus()
      }
      componentWithInputEvent.___inputEvents[key] &&
        componentWithInputEvent.___inputEvents[key].call(componentWithInputEvent, event)
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
