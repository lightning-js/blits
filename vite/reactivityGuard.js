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

import { default as processComputedProps } from './../src/lib/reactivityguard/computedprops.js'

export default function reactivityGuard() {
  return {
    name: 'reactivityGuard',
    // run before other plugings except blitsFileConverter
    // the order between blitsFileConverter and this plugin is maintained by the order of the plugins in the array in index.js
    enforce: 'pre',

    transform(code, id) {
      if (!id.endsWith('.js') && !id.endsWith('.ts') && !id.endsWith('.blits')) {
        return null
      }

      // Skip if no Blits component/application
      if (!code.includes('Blits.Component') && !code.includes('Blits.Application')) {
        return null
      }

      try {
        return processComputedProps(code)
      } catch (error) {
        console.error(`[blits-reactivity-guard] Error processing ${id}:`, error)
        return null // Return original code on error
      }
    },
  }
}
