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

import blitsfileconverter from '../src/lib/blitsfileconverter/blitsfileconverter.js'
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'module'

export default function blitsFileType() {
  return {
    name: 'vite-plugin-blits-file-type',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source.endsWith('.blits')) {
        return importer ? path.resolve(path.dirname(importer), source) : path.resolve(source)
      }
      return null
    },

    load(id) {
      if (id.endsWith('.blits')) {
        const source = fs.readFileSync(id, 'utf-8')
        let code = blitsfileconverter(source)

        // Check for TypeScript and transpile to JS if needed
        if (/<script\s+lang=["']ts["']/.test(source)) {
          // Resolve the local typescript dependency
          const userRequire = createRequire(process.cwd() + '/')
          let ts
          try {
            ts = userRequire('typescript')
          } catch (err) {
            throw new Error(
              `\n\nThe file "${id}" contains \`lang="ts"\`, indicating it uses TypeScript. \nTo enable TypeScript support, please install the 'typescript' package as a dev dependency by running:\n\n` +
                '  npm install --save-dev typescript\n\n'
            )
          }
          const transpiled = ts.transpileModule(code, {
            compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
          })
          code = transpiled.outputText
        }

        return {
          code,
          map: null,
        }
      }
      return null
    },
  }
}
