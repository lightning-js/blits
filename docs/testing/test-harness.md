# Test Harness

Blits exposes a small testing utility that lets you render a single Component without launching a full Application.

This can be useful for unit testing Components in isolation. You can pass props, update props or state, apply focus and trigger input handlers. The harness runs with a small test platform, so it can be used in a Node test environment without a browser DOM.

## Rendering a Component

Import the test helper from the testing namespace:

```js
import { renderComponent } from '@lightningjs/blits/testing'
import Button from './Button.js'

const fixture = renderComponent(Button, {
  props: {
    label: 'Play',
  },
})
```

The returned fixture contains the mounted Component instance and a few helper methods to interact with it.

## Snapshot

Use `snapshot()` to get a plain JavaScript object representation of the current Component.

```js
const snapshot = fixture.snapshot()

console.log(snapshot.props.label) // Play
console.log(snapshot.tree.children[0].attributes.content)
```

The snapshot contains:

| Key | Description |
|-----|-------------|
| `name` | Component name |
| `props` | Declared props and their current values |
| `state` | Declared state and their current values |
| `hasFocus` | Whether the Component has focus |
| `isHovered` | Whether the Component is hovered |
| `attributes` | Attributes on the Component holder element |
| `tree` | Rendered element tree of the Component |

Nested Components are included in the `tree` as Component snapshots as well.

## Finding Nodes by Inspector Data

Use `findByData()` and `findAllByData()` to find nodes with matching `inspector-data`.

```xml
<Text content="Menu" inspector-data="{testId: 'menu-title'}" />
<Element inspector-data="{role: 'menu-item'}" />
```

```js
const title = fixture.findByData('testId', 'menu-title')
const items = fixture.findAllByData('role', 'menu-item')
```

`findByData(key, value)` returns the first matching node or `null`.
`findAllByData(key, value)` returns all matching nodes, or an empty array when nothing matches.

## Updating Props and State

Props can be updated with `setProps()`.

```js
fixture.setProps({
  label: 'Pause',
})

const snapshot = fixture.snapshot()
```

State can be updated with `setState()`.

```js
fixture.setState({
  selected: true,
})
```

Both methods update the mounted Component, so reactive template bindings are updated before the next snapshot is taken.

## Focus and Input

Input handling follows the normal Blits focus behavior. This means input only runs after focus is set.

```js
await fixture.focus()

fixture.input('enter')
```

You can also pass a custom keyboard event. Use `createKeyboardEvent()` when running tests in Node.

```js
const event = fixture.createKeyboardEvent('enter', {
  keyCode: 13,
})

fixture.input('enter', event)
```

## Cleanup

Call `destroy()` after the test to clean up the mounted Component and restore the test platform.

```js
fixture.destroy()
```
