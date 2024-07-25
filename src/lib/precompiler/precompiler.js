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

import parser from '../templateparser/parser.js'
import generator from '../codegenerator/generator.js'

export default (source, filePath) => {
  if (
    source.indexOf('Blits.Component(') > -1 ||
    source.indexOf('Blits.Application(') > -1 ||
    /=>\s*Component\(['"][A-Za-z]+['"],/s.test(source) || // blits component
    /\{.*?template\s*:\s*(['"`])((?:\\?.)*?)\1.*?\}/s.test(source) // object with template key
  ) {
    const templates = source.matchAll(/(?<!\/\/\s*)template\s*:\s*(['"`])((?:\\?.)*?)\1/gs)
    let newSource = source
    /*
      if there are multiple templates in the file, we need to keep
      track of the offset caused by the previous replacements
    */
    let offset = 0

    for (const template of templates) {
      if (template[2]) {
        const templateStartIndex = template.index + offset
        const templateEndIndex = templateStartIndex + template[0].length
        const templateContent = template[2]

        // Parse the template
        let resourceName = 'Blits.Application'
        if (source.indexOf('Blits.Component(') > -1) {
          resourceName = source.match(/Blits\.Component\(['"](.*)['"]\s*,/)[1]
        }

        const parsed = parser(templateContent, resourceName, null, filePath)

        // Generate the code
        const code = generator.call({ components: {} }, parsed)

        // Insert the code in the component using the 'code' key, replacing the template key
        const replacement = `/* eslint-disable no-unused-vars */ \ncode: { render: ${code.render.toString()}, effects: [${code.effects.map(
          (fn) => fn.toString()
        )}], context: {}}`

        offset += replacement.length - template[0].length

        newSource =
          newSource.substring(0, templateStartIndex) +
          replacement +
          newSource.substring(templateEndIndex)
      }
    }
    return newSource
  }
  return source
}
