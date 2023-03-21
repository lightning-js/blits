import test from 'tape'
import propsFn from './props.js'

test('Type props function', (assert) => {
  const expected = 'function'
  const actual = typeof propsFn

  assert.equal(actual, expected, 'props should be a function')
  assert.end()
})

test('Create a ___propkeys on component', (assert) => {
  const component = new Function()

  /* eslint-disable */
  assert.false(component.hasOwnProperty('___propKeys'), 'Component should not have a ___propKeys key')

  propsFn(component)

  /* eslint-disable */
  assert.true(component.hasOwnProperty('___propKeys'), 'Component should have a ___propKeys key')
  assert.end()
})

test('Pass props as an array', (assert) => {
  const component = new Function()
  const props = ['index', 'img', 'url']
  propsFn(component, props)

  assert.equal(props.length, component.___propKeys.length, 'All passed props should be stored on ___propKeys')
  assert.equal(props.length, props.map(prop => component.___propKeys.indexOf(prop) > -1).filter(prop => prop === true).length, 'All passed props should be stored on ___propKeys')

  props.forEach((prop) => {
    assert.true(typeof Object.getOwnPropertyDescriptor(component.prototype, prop).get === 'function', `A getter should have been created for property ${prop}`)
  })

  assert.end()
})


test('Get value of props', (assert) => {
  const component = new Function()

  const componentInstance = new component
  componentInstance.___props = {
    index: 1,
    img: 'lorem-ipsum.jpg',
    url: 'http://localhost'
  }

  const componentInstance2 = new component
  componentInstance2.___props = {
    index: 2,
    img: 'bla.jpg',
    url: 'http://127.0.0.1'
  }

  const props = ['index', 'img', 'url']
  propsFn(component, props)

  props.forEach((prop) => {
    assert.equal(componentInstance[prop], componentInstance.___props[prop], `The correct value of ${prop} should be returned via the getter`)
    assert.equal(componentInstance2[prop], componentInstance2.___props[prop], `The correct value of ${prop} should be returned via the getter`)
  })

  assert.equal(componentInstance['bla'], undefined, `Undefined should be returned if a prop doesn't exist`)
  assert.end()
})


