# Blits - Lightning 3 App Development Framework

## Template structure

Blits uses an easy-to-read _XML-style_ template syntax. The syntax is inspired by frameworks like VueJS, so developers familiar with Vue will recognize certain concepts.

The _template_ key in the Componentn configuration object holds a string with an XML-like structure. Templates often span multiple lines, so it's advisable to use a JS template literal.

You can use different tags in your templates. And similar to HTML you can use arguments and nested tags. Self-closing tags and HTML-style comments are also supported.

The default tag within a template is the `<Element>` tag, which corresponds to a node in the Lightning 3 renderer. For each element, you can define a set of predefined render properties, such as `x`, `y`, `w`, `color`, and more. Detailed information regarding the attributes supported by the `<Element>` tag can be found [here](./element_attributes.md).

Consider the following template example:

```xml
<Element x="20" y="20">
  <Element w="100" h="100" x="360" color="#0891b2" />
  <Element w="$width" h="$height" color="$color" />
  <Element :w="$changingWidth" :h="Math.floor($height / 5)" :color="$highlight" />
</Element>
```

### Hardcoded arguments

In this template, you'll observe certain arguments with hardcoded values. You use these to configure the parts of your component that never change.

### Dynamic arguments

Additionally, some arguments contain a value prefixed with a dollar sign (`$`), representing _dynamic_ arguments. When the component renders, it automatically populates these dynamic values based on the component's state (or props or computed properties).

### Reactive arguments

Furthermore, certain arguments are prefixed with a colon sign (`:`), indicating _reactive_ arguments. These are not only dynamically set when your component renders, but also _rerender_ the corresponding part of the template whenever the referenced value in your component's internal state changes. This reactive data binding eliminates the need for manual template patching, as seen in Lightning 2.

Reactive arguments support _interpolation_, enabling the use of simple JavaScript instructions, such as ternary conditions or basic string and Math manipulations. For more complex logic, it's recommended to abstract this into a Component method or a Computed property.

## Custom components

As your component grows in complexity, you may want to reorganize your codebase with custom components, abstracting and reusing both templates and logic.

Inside a component template, you can utilize sub-components (i.e. a `Menu` component) and reference them with tags like `<Menu></Menu>`.

In order for the `<Menu />` tag to become available for use in a component's template, you first have to `import` the file that exports that component.

Next you have to _register_ this imported component using the `components`-key in the configuration object. The `components` key is an _object literal_, where the value is the reference to the Blits component. The key will correspond with the _tag_ that can be used to invoke the component.

```js

import Menu from './components/menu.js'
import Button from './components/button.js'

export default Blits.Component('MyComponent', {
  components: {
    Menu, // makes <Menu /> available for use in the template
    MyButton: Button, // makes Button available as <MyButton /> in the template
  },
  template: `
    <Element>
      <Menu />
      <MyButton />
    </Element>
  `
})

```
