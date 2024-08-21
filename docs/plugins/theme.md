# Theme plugin

Blits comes with a built-in, lightweight *Theme* plugin, that can be used to easily add theming capabilities to an App.

The Blits Theme plugin provides the option to do real time theme switching, with inheritance from a base theme for missing values.

## Registering the plugin

The Theme plugin is part of the core Blits package, but it's an optional plugin that needs to be registered in the App's `index.js`,
as demonstrated in the example below.

Make sure to place the `Blits.Plugin()` method _before_ calling the `Blits.Launch()` method

```js
// index.js

import Blits from '@lightningjs/blits'
// import the theme plugin
import { theme } from '@lightningjs/blits/plugins'

import App from './App.js'

// Use the Blits Theme plugin
Blits.Plugin(theme, {
  // theme configuration object
})


Blits.Launch(App, 'app', {
  // launch settings
})
```

### Configuration

The Theme plugin requires configuration that specifies the theming definition(s).

For simple use cases, with one single theme where you just want to abstract and centralize the styling information for an App,
the configuration object can be a simple object that specifies a theme definition.

A theme definition is a completely freeform object literal with key values pairs. It can be organized and constructed however makes most sense for the App. See below an example for inspiration:

```js
Blits.Plugin(theme, {
  colors: {
    primary: '#16a34a',
    secondary: '#2563eb',
    highlight: '#ec4899'
  },
  radius: {
    small: 4,
    medium: 8,
    large: 12
  },
  fontSizes: {
    h1: 80,
    h2: 64,
    body: 42
  }
})
```

> While it's possible to create deeply nested structures in the theme definition, it is recommended to limit the level of nesting for performance reasons.


When an App has more than 1 theme, the _advanced configuration_ setup can be used. This configuration object can contain the following 3 keys:

- `themes` - an object with multiple theme definitions (required)
- `base` - the name of the base theme in the `themes`-object, that other themes can inherit from (optional, defaults to `default`)
- `current` - the name of current theme to be used (optional, defaults to `default`)

```js
Blits.Plugin(theme, {
  themes: {
    // Base theme
    base: {
      colors: {
        primary: '#16a34a',
        secondary: '#2563eb',
        highlight: '#ec4899'
      },
      radius: {
        small: 4,
        medium: 8,
        large: 12
      },
      fontSizes: {
        h1: 80,
        h2: 64,
        body: 42
      }
    },
    // Dark mode theme
    dark: {
      colors: {
        primary: '#042f2e',
        secondary: '#082f49'
      }
    },
    // Theme with larger font sizes
    large: {
      fontSizes: {
        h1: 160,
        h2: 124,
        body: 84
      }
    }
  },
  base: 'base',
  current: 'large'
})
```

In the definition above we've specified 3 different themes: `base`, `dark` and `large`. The dark and large theme are not complete definitions,
which mean that they will inherit missing values from the base theme.


## Getting theme values

With the configuration out of the way, let's look at how to use the specified theme values in an App.

The Theme plugin will be available in every component under the `this.$theme`-namespace. It exposes a `get()` method than can be used to
retrieve values from the currently active theme definition.

The `this.$theme.get()`-method accepts a `key`-argument, using _dot-notation_ (i.e. `fonts.large.lineheight`) to reference items in the theme definition. An optional second argument can be provided as a fallback value, in case the key is missing in the theme (as well as in the base theme).

Inside of the template, the `this.$theme.get()`-method can be referenced as `$$theme.get()`. The first `$`-sign is used
to refer to the Component scope (as with any other state variable or computed property in Blits) and the second `$`-sign is the prefix of
the Theme plugin itself.

```js
Blits.Component('MyComponent', {
  template: `
    <Element>
      <Text content="Hello world"
        :color="$$theme.get('colors.primary', 'blue')"
        :size="$$theme.get('fontSizes.body')"
      />
    </Element>
  `,
  computed: {
    highlight() {
      return this.$theme.get('colors.highlight')
    }
  },
})
```

## Changing themes

In case you have specified multiple themes, using the advanced configuration, it is possible to do real-time theme switching.

Besides the `get()` method, the Theme plugin also exposes a `set()`-method, to change the currently active theme. The `this.$theme.set()`-method accepts the name of the theme as its first argument.

```js
Blits.Component('MyComponent', {
  template: `
    <Element>
      <Text content="Hello world"
        :color="$$theme.get('colors.primary', 'blue')"
        :size="$$theme.get('fontSizes.body')"
      />
    </Element>
  `,
  input: {
    up() {
      this.$theme.set('dark')
    },
    down() {
      this.$theme.set('default')
    }
  },
})
```

All attributes referencing the Theme plugin that are marked as _reactive_ (i.e. those prefixed with a `:`), will update instantly when changing the theme.
