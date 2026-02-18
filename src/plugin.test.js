import { test } from 'tap'
import registerPlugin, { plugins } from './plugin.js'

test('Function plugin registration', (assert) => {
  const mockPlugin = () => ({ test: 'value' })
  const options = { config: 'test' }

  //  test function type check, valid registration, default options, custom options
  registerPlugin(mockPlugin, 'testPlugin')
  assert.ok(
    plugins.testPlugin?.plugin === mockPlugin &&
      plugins.testPlugin?.options &&
      typeof registerPlugin === 'function',
    'Function plugin registered correctly with default options'
  )

  registerPlugin(mockPlugin, 'testPluginWithOptions', options)
  assert.same(
    plugins.testPluginWithOptions.options,
    options,
    'Function plugin registered with custom options'
  )

  assert.end()
})

test('Function plugin errors', (assert) => {
  const mockPlugin = () => ({ test: 'value' })

  //  test both undefined name and empty string name error cases
  assert.throws(
    () => registerPlugin(mockPlugin),
    /Error registering plugin: name is required for plugin/,
    'Function plugin without name throws error'
  )
  assert.throws(
    () => registerPlugin(mockPlugin, { config: 'test' }),
    /Error registering plugin: name is required for plugin/,
    'Function plugin with options as name throws error'
  )

  assert.end()
})

test('Object plugin registration', (assert) => {
  const mockPlugin = () => ({ test: 'value' })
  const options = { setting: 'value' }

  //  test object plugin detection, recursive registration, name resolution, options handling
  registerPlugin({ plugin: mockPlugin, name: 'objectPlugin' })
  registerPlugin({ plugin: mockPlugin, name: 'originalName' }, 'customName')
  registerPlugin({ plugin: mockPlugin, name: 'pluginWithOptions' }, options)

  assert.ok(
    plugins.objectPlugin?.plugin === mockPlugin &&
      plugins.customName?.plugin === mockPlugin &&
      !plugins.originalName &&
      plugins.pluginWithOptions?.options === options &&
      plugins.log,
    'Object plugins registered correctly with name resolution, options, and default log plugin exists'
  )

  assert.end()
})
