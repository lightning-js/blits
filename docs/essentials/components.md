# Components

Like any modern front-end framework, Blits is built around the concept of Components. Components allow you to split the UI of your App into
reusable pieces of code and logic.

As you get started building your App, you're free to put all your elements and logic right in the root Application component.
This is great for quickly playing around with Blits and Lightning.

But soon you'll find that it's beneficial to start organizing the different parts of your App into separate components. Blits Components can be nested into a tree of components.

Components in Blits follow a clearly defined structure, which helps keep your code clean and guides you to quickly build your components.

This universal structure is also valuable for creating drop-in components that can be easily shared across projects.

## Creating a new Component

Let's see how to create a new component and explore the basic anatomy of a component.

A new component is created using the `Blits.Component()` function that is exported from the `@lightningjs/blits` package. This function accepts two arguments:

- The first argument is the _name_ of the component. This name will be used in debug log messages, so make sure to choose a unique and descriptive name for your component, such as `Homepage`, `Loader`, or `SidebarMenuItem`.

- The second argument is a _Component configuration object_, represented as an `object literal`. This Component configuration object can contain a predefined set of key-value pairs, that define how your Component looks and behaves.

Some of the commonly used Component configuration options include:

   - `template`: to define the template for the component.
   - `state`: to specify the component instance's internal state.
   - `props`: to define the props that can be passed into the component.
   - `hooks`: allowing you to hook into different lifecycle events of the component.
   - `input`: used to tap into user input.
   - `methods`: used to define more complex functionality of the component

A basic Blits component will then look something like this:

```js
// src/components/Loader.js
export default Blits('Loader', {
  template: `
    <Element x="880" y="500" :show="$active">
      <Element x="$offset" w="40" h="40" color="#94a3b8" :alpha="$alpha" />
    </Element>
  `,
  props: ['type', 'size'],
  state() {
    return {
      active: false,
      alpha: 0.4,
      offset: 100
    }
  },
  hooks: {
    ready() {
      this.$setTimeout(() => {
        this.active = true
      }, 300)
    }
  },
  input: {
    enter() {
      this.alpha = 1
    }
  }
})
```

In the next sections, we will go into the details of each of the component configuration options.

