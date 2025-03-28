# Text-to-Speech / Announcer

Blits comes with a built-in Text-to-Speech / Announcer functionality, to easily make your App more accessible. This is something that's often overlooked when developing an App, but having speech assistance integrated into your App is a huge deal for those users who are visually impaired.

## Integrated with the router

The Announcer in Blits is directly integrated with the router functionality. This means that through simple configuration, a descriptive message can be announced, when navigating from page to page, without the need for adding extra custom code.

Just add an `announce` key in the configuration of your route, that contains the message you would like to be announced when visiting that route.

```js
const routes = [
  // ...
  {
    path: '/settings',
    component: Settings,
    announce: "Welcome to the Settings page",
  },
  // ...
]
```

## Custom announcement messages

Furthermore, it's possible to speak out custom messages anywhere in your App logic, for example when a component receives focus, as a reaction to user input, or to announce error messages when a remote API call
fails.

Each component in Blits has a `this.$announcer.speak()` available, which accepts `string` of a message to be announced.

```js
Blits.Component('MyComponent', {
  // ...
  hooks: {
    focus() {
      this.$announcer.speak('MyComponent just got focus')
    }
  },
  keys: {
    right() {
      if(this.focused === this.items.length - 1) {
        this.$announcer.speak('End of row reached')
      } else {
        //
      }
    }
  }
})
```

## Enabling / disabling the announcer

By default the announcer is disabled. This mean that whenever you call `this.$announcer.speak()` there will actually not be anything spoken out via the Text To Speech engine.

In order to enable utterances being spoken out, you can set the Blits launch setting `announcer` to `true` in the index.js.

Alternatively the announcer can be enabled or disabled run time by using one of the following methods on the Announcer pluging:

- `this.$announcer.enable()` - activates the announcer
- `this.$announcer.disable()` - deactivates the announcer
- `this.$announcer.disable(true/false)` - turns the announcer or on off