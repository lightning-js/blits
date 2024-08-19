# Methods

Within a Blits component, you have quite some freedom where to put specific logic.

Template related logic can be either placed directly in a _reactive / interpolated_ attribute or you can move it out to a _computed property_ if the logic is more complex.

Business logic for your App can be placed directly in a _watcher_, a _lifecycle hook_ or an _input handling_ function.

If you notice that you're duplicating logic in these different places, or if you just like to keep all your business logic nicely grouped together, you can move these business logic functions under the `methods` key of the _Component configuration object_.

You can reference your Component's methods in the template by using a `$`-sign (for example in the `@loaded`-attribute when your element has a `src` attribute).

In the javascript code of a Component, you can reference methods directly on the `this`-scope (i.e. `this.getData()`). Similar to `internal` state and `props`, there is no need to prefix with `methods`, for easy access.

```js
export default Blits('Carousel', {
  template: `
    <Element>
      <!-- .... -->
    </Element>
  `,
  state() {
    return {
      items: [],
      page: 0
    }
  },
  hooks: {
    ready() {
      this.fetchData()
    }
  },
  input: {
    down() {
      this.page++
      this.fetchData()
    }
  },
  methods: {
    async fetchData() {
      this.items = await API.get(['movies', 'tvshows', 'documentaries'], this.page)
    },
  }
})
```
