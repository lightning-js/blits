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

import compiler from '../src/lib/precompiler/precompiler.js'
import path from 'path'

export default function () {
  let config
  return {
    name: 'preCompiler',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    transform(source, filePath) {
      if (config.blits && config.blits.precompile === false) return source

      const fileExtension = path.extname(filePath)

      // we should only precompile .blits, .js and .ts files
      if (fileExtension === '.js' || fileExtension === '.ts' || fileExtension === '.blits') {
        return compiler(source, filePath)
      }

      // vite expects null if there is no modification
      return null
    },
  }
}
