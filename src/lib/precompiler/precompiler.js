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
import MagicString from 'magic-string'

export default (source, filePath, mode) => {
  if (
    source.indexOf('Blits.Component(') > -1 ||
    source.indexOf('Blits.Application(') > -1 ||
    /=>\s*Component\(['"][A-Za-z]+['"],/s.test(source) || // blits component
    /\{.*?template\s*:\s*(['"`])((?:\\?.)*?)\1.*?\}/s.test(source) // object with template key
  ) {
    const templates = source.matchAll(/(?<!\/\/\s*)template\s*:\s*(['"`])((?:\\?.)*?)\1/gs)

    // Use MagicString to track changes
    const s = new MagicString(source)

    for (const template of templates) {
      if (template[2]) {
        const templateContent = template[2]

        // Only process if it looks like a Blits template
        if (templateContent.match(/^\s*(<!--[\s\S]*?-->|<[A-Za-z][^>]*>)/s)) {
          // Use original indices - MagicString handles position tracking automatically
          const templateStartIndex = template.index
          const templateEndIndex = templateStartIndex + template[0].length

          // Parse the template
          let resourceName = 'Blits.Application'
          if (source.indexOf('Blits.Component(') > -1) {
            resourceName = source.match(/Blits\.Component\(['"](.*)['"]\s*,/)[1]
          }

          const parsed = parser(templateContent, resourceName, null, filePath)

          // Generate the code
          const code = generator.call({ components: {} }, parsed, mode === 'development')

          // Insert the code in the component using the 'code' key, replacing the template key
          const replacement = `/* eslint-disable no-unused-vars */ \ncode: { render: ${code.render.toString()}, effects: [${code.effects.map(
            (fn) => fn.toString()
          )}], context: {}}`

          // MagicString tracks all changes automatically, no offset needed
          s.overwrite(templateStartIndex, templateEndIndex, replacement)
        }
      }
    }

    const newSource = s.toString()

    if (newSource !== source) {
      const fileName = filePath.split(/[\\/]/).pop()
      return {
        code: newSource,
        map: s.generateMap({
          hires: true,
          source: fileName,
          includeContent: true,
          file: fileName,
        }),
      }
    }
  }
  return source
}
