/*
 * Copyright 2025 Comcast Cable Communications Management, LLC
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

import { Log } from '../lib/log.js'
import { getAncestors } from './helpers.js'

let hoveredComponent = null
let hoverChain = []

export default {
  get() {
    return hoveredComponent
  },
  set(component) {
    if (component === undefined || component.eol === true) return

    // early return if already hovered
    if (component === hoveredComponent) return

    if (hoveredComponent === null) {
      hoverChain = getAncestors([component])
    }

    // unhover currently hovered components
    if (hoveredComponent !== null) {
      if (hoverChain[hoverChain.length - 1] === component.parent) {
        hoverChain.push(component)
      } else {
        const newhoverChain = getAncestors([component])
        let i = hoverChain.length
        while (i--) {
          // don't unhover when part of the new hover chain
          if (newhoverChain.indexOf(hoverChain[i]) > -1) break
          // skip if component is destroyed
          if (hoverChain[i].eol !== true) {
            hoverChain[i].lifecycle.state = 'unhover'
          }
        }
        hoverChain = newhoverChain
      }
    }

    // ensure that all components in the hover path have hover state
    let i = 0
    while (i < hoverChain.length - 1) {
      // skip if component is destroyed
      if (hoverChain[i].eol !== true) {
        hoverChain[i].lifecycle.state = 'hover'
      }
      i++
    }

    setHover(component)
  },
  clear() {
    if (hoveredComponent === null) return
    for (let i = 0; i < hoverChain.length; i++) {
      if (hoverChain[i].eol !== true) {
        hoverChain[i].lifecycle.state = 'unhover'
      }
    }
    hoveredComponent = null
    hoverChain = []
  },
}

/**
 * Set the hover to the Component
 * @param {Object} component  - The component to hover
 */
const setHover = (component) => {
  Log.info(
    '\nHover chain:\n',
    hoverChain.map((c, index) => '\t'.repeat(index) + '↳ ' + c.componentId).join('\n')
  )

  hoveredComponent = component
  component.lifecycle.state = 'hover'
}
