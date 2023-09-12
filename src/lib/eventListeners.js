/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
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

const eventsMap = new Map()

export default {
  registerListener(component, event, cb) {
    let componentsMap = eventsMap.get(event)
    if (!componentsMap) {
      componentsMap = new Map()
      eventsMap.set(event, componentsMap)
    }

    let components = componentsMap.get(component)
    if (!components) {
      components = new Set()
      componentsMap.set(component, components)
    }

    components.add(cb)
  },
  executeListeners(event, params) {
    const componentsMap = eventsMap.get(event)
    if (componentsMap) {
      componentsMap.forEach((component) => {
        component.forEach((cb) => {
          cb(params)
        })
      })
    }
  },
  removeListeners(component) {
    eventsMap.forEach((componentMap) => {
      const cmp = componentMap.get(component)
      if (cmp) {
        cmp.clear()
        componentMap.delete(cmp)
      }
    })
  },
}
