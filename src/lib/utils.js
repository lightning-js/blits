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

/**
 * A mapping of common screen resolution names to their scale factors relative to 1080p (Full HD).
 *
 * @type {Object<string|number, number>}
 * @property {number} hd - 0.666... (720p)
 * @property {number} '720p' - 0.666... (720p)
 * @property {number} 720 - 0.666... (720p)
 * @property {number} fhd - 1 (Full HD)
 * @property {number} fullhd - 1 (Full HD)
 * @property {number} '1080p' - 1 (Full HD)
 * @property {number} 1080 - 1 (Full HD)
 * @property {number} '4k' - 2 (2160p)
 * @property {number} '2160p' - 2 (2160p)
 * @property {number} 2160 - 2 (2160p)
 */
export const screenResolutions = {
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

/**
 * Checks if a value is a transition object.
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a transition object, false otherwise.
 */
export const isTransition = (value) => {
  return value !== null && typeof value === 'object' && 'transition' in value === true
}

/**
 * Checks if a transition object has a duration of zero.
 * @param {any} value - The value to check.
 * @returns {boolean} True if the transition duration is zero, false otherwise.
 */
export const isZeroDurationTransition = (value) => {
  return value.transition.duration === 0
}

/**
 * Checks if a string is an object string (starts and ends with curly braces).
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is an object string, false otherwise.
 */
export const isObjectString = (str) => {
  return typeof str === 'string' && str.startsWith('{') && str.endsWith('}')
}

/**
 * Checks if a string is an array string (starts and ends with brackets).
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is an object string, false otherwise.
 */
export const isArrayString = (str) => {
  return typeof str === 'string' && str.startsWith('[') && str.endsWith(']')
}

/**
 * Parses a string into an object, converting single quotes to double and adding quotes to keys.
 * @param {string} str - The string to parse.
 * @returns {object} The parsed object.
 */
export const parseToObject = (str) => {
  return JSON.parse(str.replace(/'/g, '"').replace(/([\w-_]+)\s*:/g, '"$1":'))
}
