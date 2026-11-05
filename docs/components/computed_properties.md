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

Computed properties are evaluated on first access and their results are cached per component instance. Repeated reads reuse the cached value. Whenever a referenced reactive state variable or prop changes, the cache is invalidated and the next read recalculates the value. Changes to nonreactive values do not invalidate the cache.

If a computed property is referenced reactively in the template (i.e., the argument is prefixed with colons `:`), it will also trigger an automatic rerender of that portion of the template.

Computed properties should **not** have any _side effects_ (i.e. should not change the value of any state variable). Side effects can potentially lead your app into an endless loop if not handled carefully. If you want to execute certain logic upon state changes, you can consider to use a [watcher](./watchers.md) for this.

## Batching related updates

By default, each change to a reactive state variable used by a computed property invalidates its cached value. Reactive bindings that reference the computed property update immediately. Multiple consecutive state changes can therefore trigger repeated computed evaluations and binding updates. This can potentially lead to multiple render updates. Use `this.$batch()` to group related state changes so those bindings update together and share a single computed evaluation:

```js
this.$batch(() => {
  this.items[0].quantity += 100
  this.discount += 10
})
```

State changes immediately, and reading a computed property inside the callback returns a value based on the current state. Reactive consumers, including template bindings and watchers, wait until the batch exits. Each queued consumer runs once with the final values, so multiple bindings can share one computed calculation. Writes triggered by consumers during flushing still propagate synchronously.

Nested batches flush when the outermost callback exits, before `$batch()` returns; updates are not delayed until the end of the tick. Batching also covers reactive updates to other components made during the callback. Updates outside a batch retain their normal synchronous behavior.

The callback receives the component as `this`, and `$batch()` returns its result. If the callback throws, changes already made are flushed before the error propagates; changes are not rolled back. Consumer errors propagate synchronously and clear the remaining queue, as with ordinary reactive updates. If both the callback and a consumer throw, the callback's original error is preserved.

The callback must be synchronous: do not pass an `async` function or return a Promise. Await asynchronous work before entering the batch:

```js
const result = await fetchCart()

this.$batch(() => {
  this.items = result.items
  this.discount = result.discount
})
```

