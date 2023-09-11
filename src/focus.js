/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
      if (componentWithInputEvent.___inputEvents[key]) {
        componentWithInputEvent.___inputEvents[key].call(componentWithInputEvent, event)
      } else if (componentWithInputEvent.___inputEvents.any) {
        componentWithInputEvent.___inputEvents.any.call(componentWithInputEvent, event)
      }
    }
  },
}

const walkChain = (components, key) => {
  if (
    components[0].___inputEvents &&
    (typeof components[0].___inputEvents[key] === 'function' ||
      typeof components[0].___inputEvents.any === 'function')
  ) {
    return components
  } else if (components[0].parent) {
    components.unshift(components[0].parent)
    return walkChain(components, key)
  } else return []
}
