# Blits - Lightning 3 App Development Framework

## Component State

In Blits, a component can be as simple as a template with fixed, hardcoded values. However, for dynamic behavior and logic, you'll often want to extend your components with an _internal state_.

Some key concepts to keep in mind regarding Component state:

- Each component _instance_ maintains its own distinct internal state.
- The component state is defined within the `state` key of the Component configuration object.
- The `state` is expected to be a `function` (a regular function, not an ES6 arrow function), that returns an object representing the component's state.
- The structure of the `state` object is flexible, allowing you to define state values according to your component's requirements. These values can range from `strings`, `booleans`, `arrays`, to even nested `objects`.
- While flexibility in structuring your state is advantageous, be cautious about excessive nesting, as it could have a negative effect on performance.

### Accessing State in Templates

As explained in the [template section](./template_syntax.md), you can refer to state variables in an Element's arguments by prefixing the state variable name with a _dollar sign_ (e.g., `$alpha`). For nested objects, you can use_dot notation_ (e.g., `$style.dimensions.w`).

### Accessing State in Component Code

In your component's code, you can reference state variables within the `this` scope. For instance, a state variable named `color` can be accessed and modified by referencing `this.color`. It's important to note that unlike in the template, you should _not_ use the dollar sign when accessing state variables within the component's code.

```js
export default Blits.Component('MyComponent', {
  template: `
    <Element :show="$active">
      <Element :x="$style.x" w="100" :h="$style.dimensions.h">
        <Element w="20" :h="$style.dimensions.h / 2" :color="$color" />
      </Element>
    </Element>
  `,
  state() {
    return {
      active: false,
      items: [],
      style: {
        positions: {
          x: 100,
        },
        dimensions: {
          h: 100,
        },
      },
      color: 'tomato'
    }
  }
  hooks: {
    ready() {
      this.active = true
      this.$setInterval(() => {
        this.style.positions.x += 10
      })
    }
  },
  input: {
    right() {
      this.color = '#c0ffee'
    }
  }
})
```
