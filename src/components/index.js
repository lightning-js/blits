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

import Image from './Image.js'
import Circle from './Circle.js'
import RouterView from './RouterView.js'
import Sprite from './Sprite.js'
import FPScounter from './FPScounter.js'
import Layout from './Layout.js'

export default () => ({
  Image: Image(),
  Circle: Circle(),
  RouterView: RouterView(),
  Sprite: Sprite(),
  FPScounter: FPScounter(),
  Layout: Layout(),
})
