# Language plugin

Blits comes with a built-in Language plugin, that can be used to add internationalization (i18n) to your App.

The Blits Language plugin is a simple and lightweight implementation, closely modeled after the tried and tested Language plugin in the Lightning-SDK (for Lightning 2). It is designed to provide a flexible and easy way of translating texts to multiple languages, in a performant way.

## Registering the plugin

While the Language plugin is provided in the core Blits package, it's an _optional_ plugin that needs to be registered before you're able to use it. As such the Language plugin is _tree-shakable_, i.e. for Apps that don't have a need for translation functionality, the Language plugin will not be part of the final App bundle.

The Language plugin should be imported from Blits and registered in the App's `index.js`, as demonstrated in the example below.

Make sure to place the `Blits.Plugin()` method _before_ calling the `Blits.Launch()` method

```js
// index.js

import Blits from '@lightningjs/blits'
// import the language plugin
import { language } from '@lightningjs/blits/plugins'

import App from './App.js'

// Use the Blits Language plugin and
// optionally pass in a settings object
Blits.Plugin(language, {
  file: '/assets/translations.json', // file with translations
  language: 'EN-us', // default language
})


Blits.Launch(App, 'app', {
  // launch settings
})
```

The Language plugin accepts an optional configuration object with 2 keys:

- `file` - the JSON file with translations to be loaded at initialization
- `language` - the default language to use

After registration of the Language plugin, it will be availabe in each Blits Component as `this.$language`.

## Translations file

The most common way of defining a set of translations, is to use a dedicated JSON file, modeled after
the following format:

```json
{
    "nl-NL": {
      "hello": "Hallo, alles goed?",
      "bye": "Doei!",
      "replacement": "Mijn naam is {first} {last}, ik ben {age} jaar"
    },
    "en-US": {
      "hello": "Hello, how are you doing?",
      "bye": "Goodbye!",
      "replacement": "My name is {first} {last}, I'm {age} years old"
    },
    "fr-FR": {
      "hello": "Bonjour, ça va?",
      "bye": "Au revoir!",
      "replacement": "Je m'appelle {first} {last}, j'ai {age} ans"
    },
    "de-DE": {
      "hello": "Gutentag, wie geht's?",
      "bye": "Tschüss!",
      "replacement": "Mein Name ist {first} {last}, ich bin {age} Jahre alt"
    }
  }
```

Each top level key represents a language, which contains an object with translation key-value pairs. The language key
doesn't require to be in a specific format, but it's recommended to use ISO-codes.

When the JSON file is specified in the Plugin registration method, the language file is loaded automatically upon instantiation.

In case you want to load the file with translations manually, you can use the `this.$language.load()`-method anywhere in a Component and pass in the path to the JSON file as the first argument.

## Defining translations manualy

As an alternative to a JSON file with translations, you can also define translations directly via an object, using the `translations()`-method.

The `this.$language.translations()`-methods accepts a translations object as it's first argument, following the same format as the JSON file. The method is typically used in an `init` or `ready` hook

```js
Blits.Component('MyComponent', {
  // ...
  hooks: {
    init() {
      this.$language.translations({
        english: {
          hello: "Hello",
          world: "World"
        },
        italian: {
          hello: "Ciao",
          world: "Mondo"
        }
      })
    }
  },
})
```

## Setting the language

In order to set (or change) the current language, the `this.$language.set()`-method can be used, passing in the new language code (matching one of the languages defined in the translations).

```js
Blits.Component('MyComponent', {
  // ...
  input: {
    enter() {
      this.$language.set('pt-BR')
    }
  },
})
```

## Getting the current language

The current language can be retrieved via the `this.$language.get()` method. It will return the currently set language code.

## Translating

The most important functionality in the Language plugin is translating. The Language plugin exposes a `translate()` method that takes as string to translate as it's first argument. It will return the translated value in the currently set language. If either the language or the string to translate can't be found, it will return the inputed string.

The translate method can be used both inside the javascript business logic, but also directly in the template.

```js
Blits.Component('MyComponent', {
  template: `
    <Element>
      <Text :content="$$language.translate('hello')" />
      <Text y="100" :content="$$language.get()" />
    </Element>
  `,
  hooks: {
    ready() {
      console.log(this.$language.translate('world'))
    }
  },
})
```

Note that in the template definition 2 consecutive dollars signs are used (`$$language`). The first `$`-sign is used
to refer to the Component scope, as with any other state variable or computed property refereced in the template.

The second `$`-sign is needed, since the Language plugin itself is prefixed with a dollar sign on the Component scope as well (i.e `this.$language`).


### Dynamic replacements

The `tranlate()`-method also supports dynamic replacements. This allows you to specify variables inside your translation string, and replace them with dynamic values passed into the `translate()`-method.

Replacements are marked in the translation value using _handlebars_, like so:

```js
{
  replacements = "My name is {first} {last}, I'm {age} years old"
}
```

Now when you call the `translate()`-method and pass in an object with dynamic values, those will be replaced
in the final string accordingly:

```js
this.$language.translate('replacements', {name: 'John', last: 'Doe', age: 18})
// result: My name is John Doe, I'm 18 years old
```
