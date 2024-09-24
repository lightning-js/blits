# Global App State plugin

Each Blits Component has its own, internal component state that is reactive and can automatically trigger updates in the template upon changes. The internal state is fully encapsulated, which ensures predictable component state and promotes a pattern of clear separation of concerns.

But a Component usually doesn't live on its own, instead it's part of a bigger App. And there may arise a need for components to exchange data - intercomponent communication in other words.

Blits offers the option to _emit_ and _listen_ to events, as explained in the section on Blits [utility methods](../components/utility_methods.md). For simple use cases, this is a convenient method to pass data along. But when used extensively, it may be easy to lose track of data flows.

For more advanced cases, Blits offers an optional Global App State plugin that will act as a global state store that all components have direct access to. It's a simple implementation, focused on providing a _performant_ and _easy to use_ solution for global state. It's not a full flux / redux style state management solution, as we know from experience that these solutions (while very useful and cool), may lead to performance issues on low-end devices.

## Registering the plugin

The Global App state plugin is provided in the core Blits package, but as it's an _optional_ plugin it first needs to be registered.

The plugin can be imported from Blits and registered in the App's `index.js`, as demonstrated in the example below.

Make sure to place the `Blits.Plugin()` method _before_ calling the `Blits.Launch()` method.

```js
// index.js

import Blits from '@lightningjs/blits'
// import the app state plugin
import { appState } from '@lightningjs/blits/plugins'

import App from './App.js'

// Use the Blits App State plugin
Blits.Plugin(appState, {
  loggedIn: false,
  user: {
    id: null,
    name: '',
    lastname: ''
  },
  languages: ['en', 'nl', 'pt', 'es'],
})


Blits.Launch(App, 'app', {
  // launch settings
})
```

### State object

When registering the Global App State plugin, you pass it a state object as the second argument. This is a plain object literal that will be converted into a _reactive_ object, and is used to keep track the global state variables.

The newly created Global App state works exactly the same as an internal Component state. You can read values and you can directly change values. And when you do change a value, it automatically triggers reactive updates. Either via reactive attributes in the template, or in the form of watchers / computed values in the Component logic.

### Using global app state in a Component

Any variable in the Global App state can be used directly in the template, much like a local Component state. Changing values in the global app state also works exactly the same as updating the internal component state.

```js
Blits.Component('MyComponent', {
  template: `
    <Element>
      <Text :content="$$appState.loggedIn ? $$appState.user.name : 'Not logged in'" />
    </Element>
  `,
  input: {
    enter() {
      this.$appState.user.name = 'John'
      this.$appState.loggedIn = true
    }
  },
})
```

Note that in the template definition, 2 consecutive dollars signs are used (`$$appState`). The first `$`-sign is used
to refer to the Component scope, as with any other state variable or computed property referenced in the template.

The second `$`-sign is needed, since the appState plugin itself is prefixed with a dollar sign, to prevent accidental naming collisions.

In order to read or update variables on the global app state inside the component logic, you can access the entire state via `this.$appState`.

