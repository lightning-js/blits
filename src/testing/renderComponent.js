/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
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
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import Settings from '../settings.js'
import { renderer, stage } from '../launch.js'
import symbols from '../lib/symbols.js'
import { initLog } from '../lib/log.js'
import { getRaw } from '../lib/reactivity/reactive.js'

let nodeId = 0

const renderComponent = (Component, options = {}) => {
  const originalElement = stage.element

  Settings.set(options.settings || {})
  initLog()
  mockRenderer()
  // Generated template code calls stage.element through `this.element`
  stage.element = createElement

  const root = createElement()
  const parent = {
    $focus() {},
    $input() {
      return false
    },
  }
  const component = Component({ props: options.props || {} }, root, parent)

  const snapshot = () => {
    const holderMap = new WeakMap()
    collectComponents(component, holderMap)
    return componentSnapshot(component, holderMap)
  }

  const setProps = (props = {}) => {
    const keys = Object.keys(props)
    for (let i = 0; i < keys.length; i++) {
      component[symbols.props][keys[i]] = props[keys[i]]
    }
  }

  const destroy = () => {
    if (component.eol !== true) {
      component.destroy()
    }
    stage.element = originalElement
  }

  return {
    component,
    root,
    snapshot,
    setProps,
    destroy,
  }
}

const mockRenderer = () => {
  // Lifecycle hooks register renderer events even in headless tests
  if (renderer.on === undefined) renderer.on = () => {}
  if (renderer.off === undefined) renderer.off = () => {}
}

const collectComponents = (component, holderMap) => {
  if (component === undefined || component === null) return
  // Component tags render as holder elements; keep the link for snapshots
  if (component[symbols.holder] !== undefined) {
    holderMap.set(component[symbols.holder], component)
  }
  const children = component[symbols.children] || []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child && child.$componentId !== undefined) {
      collectComponents(child, holderMap)
    }
  }
}

const elementSnapshot = (element, holderMap) => {
  const component = holderMap.get(element)
  if (component !== undefined) {
    return componentSnapshot(component, holderMap)
  }

  const children = []
  for (let i = 0; i < element.children.length; i++) {
    children.push(elementSnapshot(element.children[i], holderMap))
  }

  return {
    type: elementType(element.attributes),
    attributes: attributesSnapshot(element.attributes),
    children,
  }
}

const componentSnapshot = (component, holderMap) => {
  const holder = component[symbols.holder]
  const wrapper = component[symbols.wrapper]
  const children = wrapper ? [elementSnapshot(wrapper, holderMap)] : []

  return {
    type: 'Component',
    name: componentName(component),
    attributes: holder ? attributesSnapshot(holder.attributes) : {},
    props: propsSnapshot(component),
    state: stateSnapshot(component),
    children,
  }
}

const attributesSnapshot = (attributes) => {
  const out = {}
  const keys = Object.keys(attributes)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (
      key === '___wrapper' ||
      key === '__textnode' ||
      key === '__layout' ||
      key === 'holder' ||
      key === 'parent'
    ) {
      continue
    }
    if (attributes[key] !== undefined) {
      out[key] = clone(attributes[key])
    }
  }
  return out
}

const propsSnapshot = (component) => {
  const props = component[symbols.props] || {}
  const propKeys = component[symbols.propKeys] || Object.keys(props)
  const out = {}
  for (let i = 0; i < propKeys.length; i++) {
    const key = propKeys[i]
    if (props[key] !== undefined) {
      out[key] = clone(props[key])
    }
  }
  return out
}

const stateSnapshot = (component) => {
  const state = component[symbols.state] || {}
  const originalState = component[symbols.originalState] || {}
  const stateKeys = Object.keys(originalState)
  const out = {}
  for (let i = 0; i < stateKeys.length; i++) {
    const key = stateKeys[i]
    if (key === '$hasFocus' || key === '$isHovered') continue
    if (state[key] !== undefined) {
      out[key] = clone(state[key])
    }
  }
  return out
}

const componentName = (component) => {
  const match = component.$componentId && component.$componentId.match(/^BlitsComponent::(.+)_\d+$/)
  return match ? match[1] : 'Component'
}

const elementType = (attributes) => {
  if (attributes.__textnode === true) return 'Text'
  if (attributes.__layout === true) return 'Layout'
  if (attributes[symbols.isSlot] === true) return 'Slot'
  if (attributes[symbols.isSprite] === true) return 'Sprite'
  return 'Element'
}

const clone = (value) => {
  value = getRaw(value)

  if (Array.isArray(value) === true) {
    return value.map((v) => clone(v))
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return cleanObject(value)
  }

  return value
}

const cleanObject = (value) => {
  const out = {}
  const keys = Object.keys(value)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (value[key] !== undefined) {
      out[key] = clone(value[key])
    }
  }
  return out
}

const createElement = ({ parent } = {}) => {
  // Minimal BlitsElement mock used by generated render/effect code
  const element = {
    attributes: {},
    children: [],
    node: {
      children: [],
      on() {},
      off() {},
    },
    parent,
    populate(attributes = {}) {
      this.nodeId = ++nodeId
      const keys = Object.keys(attributes)
      for (let i = 0; i < keys.length; i++) {
        this.set(keys[i], attributes[keys[i]])
      }
      if (attributes[symbols.isSlot] !== undefined) {
        this.attributes[symbols.isSlot] = attributes[symbols.isSlot]
      }
      if (attributes[symbols.isSprite] !== undefined) {
        this.attributes[symbols.isSprite] = attributes[symbols.isSprite]
      }
    },
    set(key, value) {
      this.attributes[key] = value
      this.node[key] = value
    },
    setInspectorMetadata() {},
    destroy() {
      this.eol = true
      this.children.length = 0
      this.node.children.length = 0
    },
  }

  appendToParent(element, parent)

  return element
}

const appendToParent = (element, parent) => {
  if (parent === undefined || parent === null || parent === 'root') return
  if (parent.children === undefined) return
  parent.children.push(element)
  if (parent.node && parent.node.children) {
    parent.node.children.push(element.node)
  }
}

export default renderComponent
