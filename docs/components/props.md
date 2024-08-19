# Props

Components in Blits have their own [internal state](./component_state.md) and logic, and as such a Component is self-contained. However, as each component is part of a larger App scope, they may need to display different behaviors or appearances based on the rest of the app.

To achieve this, components can receive `props` from their parent component.

## Defining and passing props

In the Component configuration object, you can specify exactly which props a component accepts. These props are passed to the component via attributes in the parent component's template. Any attributes that are not explicitly defined as a prop will be ignored.

The `props` key in the Component configuration object should be an `Array`, where each item corresponds to a prop that the component can accept.

The simplest way to define props is to just list their names within the `props` array:

```js
{
  props: ['x', 'color', 'index', 'alpha']
}
```

Once specified, you can refer to these props inside the template of your component using the `$` sign, similar to how you would reference variables defined within the component's [internal state](./component_state.md) (i.e. `<Element color="$color" />`).

You can also access a prop inside a component's code using `this.color` (without a dollar sign!). And similar to component `state` variables,
there is no need to specifically reference the `props`-key. Blits automatically maps all props directly on the `this`-scope, for easy access.

Since props are used to pass information from a parent to a child, it's important not to attempt to _modify_ props inside your child component. If changes based on the prop from the parent are needed, you should probably use the prop in a so called [computed property](./computed_properties.md).

## Advanced usage

For more advanced usage, you can define props using an array with an `object` for each prop, instead of just a string with the accepted name. Within each prop object, you can:

- Specify a _default value_ for the prop if it's omitted.
- _Validate_ the value of the prop based on certain criteria.
- Mark the prop as _required_.
- Apply a `cast` function to modify the value passed as a prop.

As you can see in the following example, you can mix and match the simple string notation with the advanced object notation within the same `props` array.


```js
export default Blits.Component('MyComponent', {
  // ...
  props: [
    'color',
    {
      key: 'alpha',
      default: 0.5,
      required: true,
      validate(v) {
        return v <= 1 && v >= 0;
      },
      cast: Number
    }
  ]
})
```
