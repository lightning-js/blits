/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

// FTL engine entry: mirrors L3/index.js `{ Element, Launch }` so
// `src/launch.js` (`stage.element = engine.Element`) can select it via
// `settings.renderer: 'ftl'`.

import Element from './element.js'
import Launch from './launch.js'
import nodeAdapter from './nodeAdapter.js'

export { Element, Launch, nodeAdapter }

export default {
  Element,
  Launch,
  nodeAdapter,
}
