# Custom Plugins

Besides the built-in plugins (Theme, Language, Storage, Global App State), Blits allows you to create your own **custom plugins**. Custom plugins are a great way to encapsulate reusable logic and make it available across all components in your App via the `this` scope.

## Basic Plugin Structure

A Blits plugin can be defined in two ways: as a **plugin object** or as a **function**.

### Object-style plugin

The most common approach is to export an object with a `name` and a `plugin` function:

```js
// plugins/myPlugin.js
export default {
  name: 'myPlugin',
  plugin(options) {
    // options is the object passed when registering the plugin
    return {
      greet() {
        return `Hello, ${options.name || 'World'}!`
      },
    }
  },
}
```

### Function-style plugin

Alternatively, you can export a plain function. In this case, you must provide the plugin name when registering it:

```js
// plugins/myPlugin.js
export default function(options) {
  return {
    greet() {
      return `Hello, ${options.name || 'World'}!`
    },
  }
}
```

## Registering a Custom Plugin

Custom plugins are registered in the App's `index.js` using `Blits.Plugin()`, just like the built-in plugins.

Make sure to place the `Blits.Plugin()` method _before_ calling the `Blits.Launch()` method.

```js
// index.js
import Blits from '@lightningjs/blits'
import App from './App.js'

// Object-style plugin
import myPlugin from './plugins/myPlugin.js'
Blits.Plugin(myPlugin, { name: 'Blits' })

// Or function-style plugin (name is required as second argument)
import myFunctionPlugin from './plugins/myFunctionPlugin.js'
Blits.Plugin(myFunctionPlugin, 'myFunctionPlugin', { name: 'Blits' })

Blits.Launch(App, 'app', {
  // launch settings
})
```

Once registered, the plugin is available on every Component's `this` scope, prefixed with a `$` sign:

```js
Blits.Component('MyComponent', {
  hooks: {
    ready() {
      console.log(this.$myPlugin.greet()) // "Hello, Blits!"
    },
  },
})
```

## Creating Reactive State in Plugins

A common need for plugins is to hold **reactive state** — state that, when changed, automatically triggers template updates in any component that references it. Think of how the built-in Theme and Language plugins reactively update the UI when the theme or language changes.

Blits makes this easy by providing a `this.$reactive()` method on every plugin's `this` context. This method is pre-configured with the App's reactivity mode, so you don't need to import anything or worry about internal configuration.

### `this.$reactive(target)`

Wraps a plain object in a reactive proxy. Changes to properties on the returned object will automatically trigger re-renders in any component that accesses them.

The `$reactive` method is part of the shared properties that Blits automatically applies to every plugin instance — the same mechanism that gives plugins access to `this.$emit()`, `this.$listen()`, and other framework utilities.

### Example: A reactive counter plugin

```js
// plugins/counter.js
export default {
  name: 'counter',
  plugin(options) {
    const state = this.$reactive({
      count: options.initial || 0,
    })

    return {
      get count() {
        return state.count
      },
      increment() {
        state.count++
      },
      decrement() {
        state.count--
      },
      reset() {
        state.count = options.initial || 0
      },
    }
  },
}
```

Register the plugin:

```js
import Blits from '@lightningjs/blits'
import counter from './plugins/counter.js'

Blits.Plugin(counter, { initial: 0 })
```

Use it in a component — the template will automatically update when the count changes:

```js
Blits.Component('MyComponent', {
  template: `
    <Element>
      <Text :content="'Count: ' + $$counter.count" />
    </Element>
  `,
  input: {
    up() {
      this.$counter.increment()
    },
    down() {
      this.$counter.decrement()
    },
    enter() {
      this.$counter.reset()
    },
  },
})
```

Note that in the template, you use two dollar signs (`$$counter.count`). The first `$` refers to the Component scope (as with any state or computed property), and the second `$` is the plugin prefix.

## Accessing Other Plugins

Plugins can access other registered plugins directly. After all plugins are instantiated, Blits automatically exposes each plugin instance to every other plugin. So inside a plugin's returned methods, you can use `this.$otherPlugin`:

```js
export default {
  name: 'analytics',
  plugin(options) {
    return {
      trackPage(page) {
        // Access the session plugin from within the analytics plugin
        const user = this.$session?.loggedIn ? this.$session.user.name : 'anonymous'
        console.log(`[${user}] Visited: ${page}`)
      },
    }
  },
}
```

## Tips

- Only use `this.$reactive()` when you need the state to trigger template updates. For static configuration or utility methods, a plain object is sufficient.
- You can create reactive state directly inside `plugin()` and use it from returned methods via closure.
- Expose reactive state through **getters** (e.g., `get count()`) rather than exposing the raw reactive object directly. This ensures a clean API and prevents external code from accidentally bypassing reactivity.
- Keep plugins focused and small. If a plugin grows too complex, consider splitting it into multiple plugins.
