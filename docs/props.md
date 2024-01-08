# Blits - Lightning 3 App Development Framework

## Props

Components in Blits have their own internal state and logic. However, as each component is part of the larger app's scope, they may need to display different behaviors or appearances based on the rest of the app. To achieve this, components can receive `props` from their parent component.

In the Component configuration object, you can specify exactly which props a component can accept. These props are passed to the child component via attributes in the parent component's template. Any attributes not explicitly defined as a prop will be ignored.

The `props` key in the Component configuration object should be an `Array`, where each item corresponds to a prop that the component can accept. The simplest way to define props is to list their names within the `props` array.

```javascript
{
  props: ['x', 'color', 'index', 'alpha']
}
```

Once specified, you can refer to these props inside the template of your component using the `$` sign, similar to how you would reference variables defined within your component's state (i.e. `<Element color="$color" />`). Likewise, you can access a prop inside a component's code (e.g., inside the `ready()` lifecycle hook) using `this.color` (note: without a dollar sign!).

Since props are used to pass information from a parent to a child, it's important not to attempt to modify props inside your child component. If changes based on the prop from the parent are needed, you can either reference the prop inside the component state (using `this.myprop`) or use the prop in a `computed` property.

For more advanced usage, you can define props using an array of objects for each prop. Within each prop object, you can:

- Specify a _default value_ for the prop if it's omitted.
- _Validate_ the value of the prop based on certain criteria.
- Mark the prop as _required_.
- Apply a `cast` function to modify the value passed as a prop.

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

You can mix and match the simple string notation with the more advanced object notation within the same `props` array.
