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

import test from 'tape'
import createAnnouncer from './announcer.js'

let testId = 0

const setup = (options = {}) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const id = `blits-announcer-test-${testId++}`
  const announcer = createAnnouncer({ document, container, id, ...options })

  return {
    announcer,
    container,
    id,
    cleanup() {
      announcer.cancel()
      container.remove()
    },
  }
}

test('DOM announcer creates one visually hidden assertive live region', async (assert) => {
  const fixture = setup()
  const initialRegions = fixture.container.querySelectorAll(`#${fixture.id}`)

  assert.equal(initialRegions.length, 1, 'one empty region is created eagerly')
  assert.equal(initialRegions[0].textContent, '', 'region is empty before the first announcement')

  await fixture.announcer.speak({ id: 1, message: 'Play' })
  await fixture.announcer.speak({ id: 2, message: 'Pause' })

  const regions = fixture.container.querySelectorAll(`#${fixture.id}`)
  const region = regions[0]
  assert.equal(regions.length, 1, 'one region is created')
  assert.equal(region.getAttribute('role'), 'alert', 'region has alert role')
  assert.equal(region.getAttribute('aria-live'), 'assertive', 'region is assertive')
  assert.equal(region.getAttribute('aria-atomic'), 'true', 'the entire label is announced')
  assert.equal(region.style.position, 'absolute', 'region is positioned off-screen')
  assert.notEqual(region.style.display, 'none', 'region is not removed from the accessibility tree')
  assert.equal(region.textContent, 'Pause', 'latest label is mirrored into the region')

  fixture.cleanup()
  assert.end()
})

test('DOM announcer clears before repeating the same label', async (assert) => {
  const fixture = setup({ updateDelay: 5 })

  await fixture.announcer.speak({ id: 1, message: 'Play' })
  const repeated = fixture.announcer.speak({ id: 2, message: 'Play' })
  const region = fixture.container.querySelector(`#${fixture.id}`)

  assert.equal(region.textContent, '', 'the previous label is cleared synchronously')
  await repeated
  assert.equal(region.textContent, 'Play', 'the repeated label is inserted in a later task')

  fixture.cleanup()
  assert.end()
})

test('DOM announcer cancel prevents a pending label update', async (assert) => {
  const fixture = setup({ updateDelay: 10 })
  const announcement = fixture.announcer.speak({ id: 1, message: 'Do not announce' })
  fixture.announcer.cancel()

  try {
    await announcement
    assert.fail('canceled announcement should reject')
  } catch (error) {
    assert.equal(error.error, 'canceled', 'canceled status is returned')
  }

  await new Promise((resolve) => setTimeout(resolve, 15))
  const region = fixture.container.querySelector(`#${fixture.id}`)
  assert.equal(region.textContent, '', 'canceled label is not restored')

  fixture.cleanup()
  assert.end()
})

test('DOM announcer validates its message and DOM availability', async (assert) => {
  const fixture = setup()

  try {
    await fixture.announcer.speak({ id: 1 })
    assert.fail('missing message should reject')
  } catch (error) {
    assert.equal(error.error, 'Missing message', 'missing message error is returned')
  }

  try {
    await createAnnouncer({ document: null }).speak({ id: 2, message: 'Unavailable' })
    assert.fail('missing DOM should reject')
  } catch (error) {
    assert.equal(error.error, 'unavailable', 'unavailable error is returned')
  }

  fixture.cleanup()
  assert.end()
})
