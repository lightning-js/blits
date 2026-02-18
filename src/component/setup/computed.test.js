import t from 'tap'
import computedFn from './computed.js'
import symbols from '../../lib/symbols.js'
import { initLog } from '../../lib/log.js'

// --- Helpers ---
const setup = (computeds = {}, values = {}) => {
  const component = {}
  Object.assign(component, values)
  computedFn(component, computeds)
  return component
}

const assertComputed = (t, component, keyValues) => {
  for (const [key, expected] of Object.entries(keyValues)) {
    t.equal(component[key], expected, `${key} should compute correctly`)
  }
}

initLog()

// --- Tests ---

t.test('Basic computed functionality', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.firstName} ${this.lastName}`
      },
      isAdult() {
        return this.age >= 18
      },
    },
    { firstName: 'John', lastName: 'Doe', age: 25 }
  )

  t.same(component[symbols.computedKeys], ['fullName', 'isAdult'], 'Should store computed keys')
  assertComputed(t, component, { fullName: 'John Doe', isAdult: true })
  t.end()
})

t.test('Conflict detection', (t) => {
  const component = setup(
    {
      name() {
        return 'conflict'
      },
      title() {
        return 'conflict'
      },
      submit() {
        return 'conflict'
      },
      validComputed() {
        return 'works'
      },
    },
    {
      [symbols.stateKeys]: ['name'],
      [symbols.propKeys]: ['title'],
      [symbols.methodKeys]: ['submit'],
    }
  )

  t.same(component[symbols.computedKeys], ['validComputed'], 'Only non-conflicting computed added')
  t.equal(component.validComputed, 'works', 'Valid computed works')
  t.end()
})

t.test('Non-function computeds', (t) => {
  const component = setup({
    validFunction() {
      return 'valid'
    },
    invalidString: 'not a function',
    invalidNumber: 42,
  })

  t.same(
    component[symbols.computedKeys].sort(),
    ['validFunction', 'invalidNumber', 'invalidString'].sort(),
    'All keys should be included'
  )
  t.equal(component.validFunction, 'valid', 'Valid function computes correctly')
  t.end()
})

t.test('Edge cases & empty', (t) => {
  const emptyComp = setup({})
  const singleComp = setup({
    testComputed() {
      return 'test'
    },
  })

  t.same(emptyComp[symbols.computedKeys], [], 'Empty computeds produce empty keys')
  t.same(singleComp[symbols.computedKeys], ['testComputed'], 'Single computed added')
  t.equal(singleComp.testComputed, 'test', 'Computed works correctly')
  t.end()
})

t.test('Dynamic updates', (t) => {
  const component = setup(
    {
      fullName() {
        return `${this.firstName} ${this.lastName}`
      },
      description() {
        return `Name: ${this.fullName}`
      },
    },
    { firstName: 'Jane', lastName: 'Smith' }
  )

  assertComputed(t, component, {
    fullName: 'Jane Smith',
    description: 'Name: Jane Smith',
  })
  component.firstName = 'John'
  assertComputed(t, component, {
    fullName: 'John Smith',
    description: 'Name: John Smith',
  })
  t.end()
})
