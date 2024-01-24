# Blits - Lightning 3 App Development Framework

## Building Your First Component

Components in Blits follow a clearly defined structure, which helps keep your code clean and guides you to quickly build your components.

This universal structure is also valuable for the interoperability of components.

### Creating a new Component

Let's see how to create a new component and explore the basic anatomy of a component.

A new component is created using the `Blits.Component()` function. This function accepts two arguments:

1. The first argument is the name of the component, which is mainly used for debugging purposes. It's essential to choose a unique and descriptive name for your component, such as `Homepage`, `Loader` or `SidebarMenuItem`.

2. The second argument is a _configuration object_, represented as an `object literal`. This configuration object can contain a predefined set of key-value pairs, including for example:

   - `template`: to define the template for the component.
   - `state`: to specify the component instance's internal state.
   - `props`: to define the props that can be passed into the component.
   - `hooks`: allowing you to hook into different lifecycle events of the component.
   - `input`: used to tap into user input.
   - `methods`: used to define more complex functionality of the component

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

