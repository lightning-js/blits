# Component State

In Blits, a component can be as simple as a template with fixed, hardcoded values. However, for dynamic behavior and logic, you'll often want to give your components an _internal state_.

Some key concepts to keep in mind regarding Component state:

- The component state is defined within the `state` key of the Component configuration object.
- The `state` is expected to be a `function` (a regular function, not an ES6 arrow function), that returns an object representing the component's state.
- While defined on the configuration object, each component `instance` maintains its own distinct internal state.
- The structure of the `state` object is flexible, allowing you to define state values according to your component's requirements. These values can range from `strings`, `booleans`, `arrays`, to even nested `objects`.
- While you have full flexibility in structuring your state, be cautious about _excessive nesting_, as it could have a negative effect on performance.


Example of defining a component state:

```js
export default Blits.Component('MyComponent', {
  // ...
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
})
```

## Accessing State in Templates

As explained in the [template section](../essentials/template_syntax.md), you can refer to state variables in a template by prefixing the state variable name with a _dollar sign_ (e.g., `$alpha`). Think of the `$`-sign as a reference to the `this`-scope of the component.

For nested objects, you can use _dot notation_ (e.g., `$style.dimensions.w`).

## Accessing State in Component Code

In your component's code, you can reference state variables directly within the `this`-scope. For instance, a state variable named `color` can be accessed (and modified) by referencing `this.color`.

It's important to note that unlike in the template, you should _not_ use the dollar sign when accessing state variables within the component's code.
Also, remember that there is no need to explicitly reference the `state`-key. Blits automatically maps all state variables directly on the `this`-scope, for easy access.

The example below gives a full example of defining and using a component's state:

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
