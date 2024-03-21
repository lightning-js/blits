# Blits - Lightning 3 App Development Framework

## Directives

Blits comes with a few built-in attributes that tap into specific behaviour provided by the framework - also kn ows as _directives_. Most of them can be used in the template on both Elements and Components.

### Show-directive

The `show`-attribute allows you to conditionally show and hide Components and Elements.

When passed a _truthy_ value, such as `true` or `1`, the element will be made visible. And when passed a _falsy_ value (`false` or `0`) it will not be visible.

```xml
<Element>
  <Element w="100" h="100" color="purple" :show="$active"></Element>
  <Element w="100" h="100" y="200" color="purple" show="false"></Element>
</Element>
```

### Is-directive

The `is` directive allows you to dynamically instantiate a Component based on a `state` variable or a passed `prop`.

It is very useful in combination with API driven Apps, where the type of Component to use, depends on what data is returned (i.e. a `Poster` or a `HeroImage`).

The `is`-component should always be used together with the built-in `Component`-tag.

```js
export default Blits('DynamicComponents', {
  template: `
    <Element>
      <Component is="$firstComponent" />
      <Component is="$secondComponent" x="500" />
    </Element>
  `,
  props: ['firstComponent', 'secondComponent'],
})
```

At the moment it's not possible to use the `is`-attribute as a _reactive_ attribute and have a component change type after instantiation.

<!-- ### If-directive

Todo -->
