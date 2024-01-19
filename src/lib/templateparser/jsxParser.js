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
    [/([\w$]+):\s(?:this|\(void 0\))\.(.+?)(,|\s})/g, ' \':$1\':"$$$2" $3'],
  ].reduce((value, [matcher, replacer]) => {
    return value.replace(matcher, replacer)
  }, template)

  return new Function(
    `
      const jsx = {
        component(c, props = {}, ...children) {
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
