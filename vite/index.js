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

import { importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'

import preCompiler from './preCompiler.js'
import msdfGenerator from './msdfGenerator.js'

export { importChunkUrl as importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url'
export { default as preCompiler } from './preCompiler.js'
export { default as msdfGenerator } from './msdfGenerator.js'

export default [importChunkUrl(), preCompiler(), msdfGenerator()]
