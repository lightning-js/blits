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

export const DEFAULT_HOLD_TIMEOUT_MS = 50

export const DEFAULT_KEYMAP = {
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  13: 'enter',
  32: 'space',
  8: 'back',
  27: 'escape',
}

export const SCREEN_RESOLUTIONS = {
  hd: 0.66666667,
  '720p': 0.66666667,
  720: 0.66666667,
  fhd: 1,
  fullhd: 1,
  '1080p': 1,
  1080: 1,
  '4k': 2,
  '2160p': 2,
  2160: 2,
}

export const RENDER_QUALITIES = {
  low: 0.66666667,
  medium: 0.85,
  high: 1,
  retina: 2,
}
