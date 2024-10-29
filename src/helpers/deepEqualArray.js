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

const deepEqualArray = (array1, array2) => {
  if (array1 === array2) return true
  if (array1.length !== array2.length) return false

  let l = array1.length

  while (l--) {
    const value1 = array1[l]
    const value2 = array2[l]

    // values are arrays, deepEqual nested arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (deepEqualArray(value1, value2) === false) return false
    }
    // values are objects, deepEqual nested objects
    else if (
      typeof value1 === 'object' &&
      value1 !== null &&
      typeof value2 === 'object' &&
      value2 !== null
    ) {
      if (deepEqualArray(Object.entries(value1), Object.entries(value2)) === false) return false
    }
    // other type, do strict equal check
    else if (value1 !== value2) {
      return false
    }
  }

  return true
}

export default deepEqualArray
