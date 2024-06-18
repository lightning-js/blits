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

import test from 'tape'
import routes from './routes.js'
import symbols from '../../lib/symbols.js'

test('Type routes function', (assert) => {
  const expected = 'function'
  const actual = typeof routes

  assert.equal(actual, expected, 'routes should be a function')
  assert.end()
})

test('Initiating routes', (assert) => {
  const component = {}

  routes(component, {})

  assert.ok(component[symbols.routes], 'Routes symbols should be initialized')
  assert.ok(Array.isArray(component[symbols.routes]), 'Routes should be an array')
  assert.end()
})

test('Validation - Object', (assert) => {
  const definition = {
    foo: 1
  }

  assertValidationError(assert, definition, 'Expected an object, but received: 1')
})

test('Validation - Path', (assert) => {
  const definition = {
    foo: {
      path: 1
    }
  }

  assertValidationError(assert, definition, 'At path: path -- Expected a string, but received: 1')
})

test('Validation - Params object', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: 1
    }
  }

  assertValidationError(assert, definition, 'At path: params -- Expected an object, but received: 1')
})

test('Validation - Params values', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: 1
      }
    }
  }

  assertValidationError(assert, definition, 'At path: params.baz -- Expected a string, but received: 1')
})

test('Validation - Options object', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: 1
    }
  }

  assertValidationError(assert, definition, 'At path: options -- Expected an object, but received: 1')
})

test('Validation - Options undefined', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: undefined
    }
  }

  assert.doesNotThrow(
    () => routes({}, definition)
  )
  assert.end()
})

test('Validation - Options object', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: 1
    }
  }

  assertValidationError(assert, definition, 'At path: options -- Expected an object, but received: 1')
})

test('Validation - Options default params: inHistory', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: {
        inHistory: 1
      }
    }
  }

  assertValidationError(assert, definition, 'At path: options.inHistory -- Expected a value of type `boolean`, but received: `1`')
})

test('Validation - Options default params: keepAlive', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: {
        inHistory: true,
        keepAlive: 1
      }
    }
  }

  assertValidationError(assert, definition, 'At path: options.keepAlive -- Expected a value of type `boolean`, but received: `1`')
})

test('Validation - Options params', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {
        baz: '1'
      },
      options: {
        test: 1
      }
    }
  }

  assert.doesNotThrow(() => routes({}, definition), 'Should not throw given extra options\' properties')
  assert.end()
})

test('Validation - Data undefined', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      data: undefined
    }
  }

  assert.doesNotThrow(() => routes({}, definition), 'Should not throw given undefined data')
  assert.end()
})

test('Validation - Data object', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      data: 1
    }
  }

  assertValidationError(assert, definition, 'At path: data -- Expected an object, but received: 1')
})

test('Validation - Component undefined', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      component: undefined
    }
  }

  assert.doesNotThrow(() => routes({}, definition), 'Should not throw given undefined component')
  assert.end()
})

test('Validation - Component function', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      component: 1
    }
  }

  assertValidationError(assert, definition, 'At path: component -- Expected a function, but received: 1')
})

test('Validation - Hooks undefined', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      hooks: undefined
    }
  }

  assert.doesNotThrow(() => routes({}, definition), 'Should not throw given undefined hooks')
  assert.end()
})

test('Validation - Hooks object', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      hooks: 1
    }
  }

  assertValidationError(assert, definition, 'At path: hooks -- Expected an object, but received: 1')
})

test('Validation - Hooks event: before', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      hooks: {
        before: 1
      }
    }
  }

  assertValidationError(assert, definition, 'At path: hooks.before -- Expected a function, but received: 1')
})

test('Validation - Hooks event: other values', (assert) => {
  const definition = {
    foo: {
      path: 'bar',
      params: {},
      hooks: {
        baz: () => {}
      }
    }
  }

  assertValidationError(assert, definition, 'At path: hooks.baz -- Expected a value of type `never`, but received: `() => {}`')
})

test('Routes - Configuration', (assert) => {
  const component = {}
  const componentFn = () => {}
  const definition = {
    foo: {
      path: 'lightning',
      params: {
        foo: 'lightning'
      }
    },
    bar: {
      path: 'blits',
      params: {
        bar: 'blits'
      },
      options: {
        inHistory: false,
        baz: 'blits'
      },
      component: componentFn
    }
  }

  routes(component, definition)

  const result = component[symbols.routes]
  assert.deepEqual(result.foo, {
    path: 'lightning',
    params: {
      foo: 'lightning'
    },
    options: {
      inHistory: true
    }
  }, 'Route `foo` should be correct')
  assert.deepEqual(result.bar, {
    path: 'blits',
    params: {
      bar: 'blits'
    },
    options: {
      inHistory: false,
      baz: 'blits'
    },
    component: componentFn
  }, 'Route `bar` should be correct')
  assert.end()
})

function assertValidationError(assert, definition, errorMessage) {
  assert.throws(
    () => routes({}, definition),
    {
      name: 'StructError',
      message: errorMessage
    },
    `Should throw validation error: ${errorMessage}`
  )
  assert.end()
}
