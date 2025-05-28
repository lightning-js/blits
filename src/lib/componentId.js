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

const counters = {}
let counter = 0

/**
 * Creates a human-readable component ID string for a given component name.
 *
 * @param {string} name - The name of the component.
 * @returns {string} The generated human-readable component ID.
 */
export const createHumanReadableId = (name) => {
  return `BlitsComponent::${name}_${(counters[name] = (counters[name] || 0) + 1)}`
}

/**
 * Generates a new unique internal numeric ID.
 *
 * @returns {number} The next unique internal ID.
 */
export const createInternalId = () => {
  return ++counter
}

/**
 * Resets the internal counter value back to 0.
 * Used in automated tests to ensure consistent results, not intended
 * to be used in the actual framework code!
 *
 * @returns {void}
 */
export const resetCounter = () => {
  counter = 0
}
