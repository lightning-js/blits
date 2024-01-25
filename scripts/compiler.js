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

import parser from '../src/lib/templateparser/parser.js'
import generator from '../src/lib/codegenerator/generator.js'
import path from 'path'

export default (source, filePath) => {
  if (source.indexOf('Blits.Component(') > -1 || source.indexOf('Blits.Application(') > -1) {
    // get the start of the template key in de component configuration object
    const templateKeyRegex = /template:\s*([`"'])*/g
    const templateStartResult = templateKeyRegex.exec(source)

    if (templateStartResult) {
      const typeOfQuotesUsed = templateStartResult[1]
      const templateStartIndex = templateStartResult.index

      // get the template contents from the configuration object
      const templateContentsRegex = new RegExp(`${typeOfQuotesUsed}([\\s\\S]*?)${typeOfQuotesUsed}`)
      const templateContentResult = templateContentsRegex.exec(source.slice(templateStartIndex))
      const templateEndIndex =
        templateStartIndex + templateContentResult.index + templateContentResult[0].length

      // Parse the template
      let resourceName = 'Blits.Application'
      if (source.indexOf('Blits.Component(') > -1) {
        resourceName = source.match(/Blits\.Component\(['"](.*)['"]\s*,/)[1]
      }
      const componentPath = path.relative(process.cwd(), filePath)
      const parsed = parser(templateContentResult[1], resourceName, null, componentPath)

      // Generate the code
      const code = generator.call({ components: {} }, parsed)

      // Insert the code in the component using the 'code' key, replacing the template key
      const replacement = `code: { render: ${code.render.toString()}, effects: [${code.effects.map(
        (fn) => fn.toString() + ','
      )}], context: {}}`
      const newSource =
        source.substring(0, templateStartIndex) + replacement + source.substring(templateEndIndex)

      return newSource
    }
  }
  return source
}
