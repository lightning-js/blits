# Props

Components in Blits have their own [internal state](./component_state.md) and logic, and as such a Component is self-contained. However, as each component is part of a larger App scope, they may need to display different behaviors or appearances based on the rest of the app.

To achieve this, components can receive `props` from their parent component. Using props, a parent can pass information into a child Component.

## Defining and passing props

In the Component configuration object, you can specify exactly which props a component accepts. These props are passed to the component via attributes in the parent component's template. Any attributes that are not explicitly defined as a prop will be ignored.

> **Deprecation notice**:
>
> Previously the props key in the Component configuration object was an `Array`, where each item corresponded to a prop accepted by the component. The array item could either be a `String` (with simply the name of the prop), or an advanced `Object` with a default value for when the prop was not provided by the parent.
>
> Starting Blits 2.0, the array syntax for props has been **deprecated**. The syntax still works at runtime (with the exception of _casting_ and marking props as _required_ - this functionality has been dropped overall), but it is _strongly_ recommended to move to the new _object-based_ notation as soon as possible.
>
> See also the migration path below.

The `props` key in the Component configuration object should now be an `Object`, where each key corresponds to a prop that the component can accept. The value passed to the prop key is used as the default value, when no value for a prop is provided by the parent:


```js
{
  props: {
    position: 1,
    color: 'red',
    index: undefined,
    alpha: 1
  }
}
```

Once props are specified in the configuration object, they can be referred to inside the template of a component by using the `$` sign (i.e. `<Element color="$color" />`), similar to how variables defined within the component's [internal state](./component_state.md) are referenced.

You can also access a prop inside a component's code using `this.color` (without a dollar sign!). And similar to component `state` variables, there is no need to specifically reference the `props`-key. Blits automatically maps all props directly on the `this`-scope, for easy access.

Since props are used to pass information from a parent to a child, it's important to not _modify_ props inside your child component. If a value passed as a prop needs modification, then a [computed property](./computed_properties.md), using the prop value passed by the parent, is more appropriate.

### Prop types

The object notation for `props` facilitates autocompletion of available props and automatic type checking.

Types are inferred based on the default value of a prop. Types can also be added explicitly via TypeScript types or JSDoc comments:


```js
props: {
  bgColor: 'red' // type string is inferred
  /**
   * Height of the element
   * @type {number|undefined}
   */
  height: undefined,
  /**
   * Size of the component, passed as a numeric value or a predefined value
   * @type {number|presetSizes}
   */
   size: 'small'
}
```

```ts
props: {
  bgColor: 'red' as string,
  height: undefined as number,
  size: 'small' as number|presetSizes,
}
```

## Migrating from Array Syntax to Object Syntax

When migrating from the old array-based props to the new object-based props, simply convert the list of prop names into object keys, assigning an appropriate default value.

### Before (Array syntax):

```js
props: ['bgColor', 'primaryColor', 'height', 'index', 'size']
```

### After (Object syntax):

```js
props: {
  bgColor: undefined, // or provide a default bgColor
  primaryColor: undefined,
  height: undefined,
  index: undefined,
  size: undefined
}
```

You can further enhance type checking by adding JSDoc or TypeScript type annotations where needed.
