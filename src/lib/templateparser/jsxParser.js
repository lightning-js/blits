/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

export default (template = '', componentName, parentComponent, filePath = null) => {
  template = [
    // Match class constructor
    [/jsx\.component\(([A-Z][\w$]*),/gi, 'jsx.component("$1",'],
    // Match instance members
    [/([\w$]+):\s(?:this|\(void 0\))\.(.+?)(,|\s})/g, ' \'$1\':"$$$2" $3'],
  ].reduce((value, [matcher, replacer]) => {
    return value.replace(matcher, replacer)
  }, template)

  return new Function(
    `
      const isPropReactive = (propVal) => {
        // Check if propVal is an object
        if (typeof propVal === 'object' && propVal !== null) {
          // Iterate over the object's properties
          for (let key in propVal) {
            if (typeof propVal[key] === 'object') {
              if (isPropReactive(propVal[key])) {
                return true
              }
            } else {
              if (/^\\$/.test(propVal[key])) {
                return true
              }
            }
          }
        } else {
          if (/^\\$/.test(propVal)) {
            return true
          }
        }

        return false
      }

      const jsx = {
        component(c, props = {}, ...children) {

          if (typeof props === 'object' && props !== null) {
            Object.keys(props).forEach(key => {
              if (isPropReactive(props[key])) {
                props[':' + key] = props[key]
                delete props[key]
              }
            })
          }

          return {
            type: c,
            ...props,
            children: children,
          };
        },
      }
      const result = ${template}

      return {children: [ result ]}
    `
  )()
}
