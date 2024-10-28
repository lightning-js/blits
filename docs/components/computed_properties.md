# Computed properties

So far we've learned how to utilize a Component's [internal state](./component_state.md) and [props](./props.md) passed by a parent into a child component.

We've also seen how we can perform simple operations like `Math.max()` or `str.toUpperCase()` directly within an argument of a template on the Component's internal state or passed props.
However, as these operations become more complex it's more clear and more maintainable to abstract these operations into what we call _computed properties_.

Computed properties are a powerful tool for enhancing the readability of your component code. By abstracting complex or frequently used calculations from your template into computed properties, you can make your code more concise and easier to understand.


## Defining computed properties

Within the `computed`-key of the Component configuration object, you can specify an object of `functions`. Each function name you define (`offset()` for example) becomes accessible as a _computed property_.

A computed property function should always _return_ a value.

In your template, you can reference these computed properties exactly the same as you would with _state_ variables and _props_, by prefixing them with a dollar sign (e.g., `$offset`).

In the rest of your app's code, you can access these computed properties (but not modify them!) using `this.offset`. Note that similar to Component state and props, you do not need to prefix with `computed` to access the computed property.


```js
export default Blits.Component('MyComponent', {
  // ...
  computed: {
    offset() {
      return this.index * 100
    },
    bgColor() {
      return this.focused === true ? 'aqua' : '#ccc'
    }
  }
})
```

## Reactivity

Within a computed property, you can reference one or more state variables or props and _return_ a value based on calculations or logical operations.

Whenever the value of any of the referenced variables changes, the computed property will automatically recalculate.

If a computed property is referenced reactively in the template (i.e., the argument is prefixed with colons `:`), it will also trigger an automatic rerender of that portion of the template.

Computed properties should **not** have any _side effects_ (i.e. should not change the value of any state variable). Side effects can potentially lead your app into an endless loop if not handled carefully. If you want to execute certain logic upon state changes, you can consider to use a [watcher](./watchers.md) for this.

