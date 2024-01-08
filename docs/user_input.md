# Blits - Lightning 3 App Development Framework

## Handling User Input

When building an App you probably want users to interact with it as well, for example to enable them to navigate through your App. In other words, you will want to handle _user input_. In the context of a Blits / Lightning App this often will be key input via a remote control.

Blits offers an intuitive and straightforward interface to handle key input in components.

### Focus

Before diving into the specifics of key handling, it is important to understand the concept of _focus_. In a Blits app, there is always one Component that has the focus. By default this will be the root App component.

The component that currently has focus, is the one that is responsible for handling the user input at that moment. For example, when a user clicks the _right_ or _left_ button while a _Poster Component_ has focus, it is that instance of the Poster Component that will initially _receive_ the key press event.

### Configuring Input Handling

Within the Component configuration object, the `input` key is used to define how the component should react to specific key presses when it has focus. The `input` key should be an `object literal` of `functions` for each input event that the component wants to handle.

Each function corresponds to a _key name_, such as `up`, `down`, `enter`, `space`, `back`, `1`, `2`, `a` etc. Each function defined in the `input` object, receives the full `InputEvent` object as its first argument.

```javascript
export default Blits.Component('MyComponent', {
  // ...
  input: {
    up() {
      // Logic to execute when users press up
    },
    down() {
      // Logic to execute when users press down
    },
    enter() {
      // Logic to execute when users press enter
    },
  }
}
```

### Event Handling Chain

If the currently focused component does not handle a key press, Blits will traverse up the component hierarchy, checking for any _parent_ component that does have a function defined for that key press in the `input`-key. This input event handling chain continues until it reaches the root App component.

When a component handles a key press by having a corresponding function specified, the event handling chain stops by default. However, if you want the input event to propagate up the hierarchy, you can set focus to the parent element and pass the `InputEvent` object on in that function call.

```javascript
{
  input: {
    enter() {
      // Give focus to the parent
      this.parent.focus();
    },
    back(e) {
      // Give focus to the parent and let the user input event bubble
      this.parent.focus(e);
    },
  }
}
```

### Catch-All Handling

To allow a focused component to respond to any key and act as a _catch-all_, you can add an `any()` function to the input object.

```javascript
{
  input: {
    any() {
      // Logic to execute for any key press
    },
  }
}
```

### Custom Keycode mapping

Blits comes with a default keycode mapping. This mapping is a sensible default that works in your desktop browser and with most RDK based devices.

But it's possible that the keycodes and mapping of your target device are slightly or even completely different.

In Blits you can easily configure the key mapping to match your needs. In the `src/index.js` file where we instaniate the App via the `Blits.Launch` function, we can add an extra key, called `keys`, to the _settings object_.

The `'key` item should be an object literal with _key value pairs_. As the `key`, you should provide the `key` or `keyCode` of the `KeyboardEvent` and the `value` should be the name of the event as used in the `input` object of the Component configuration object.

> You can use a site like [keyjs.dev](https://keyjs.dev/) to find the key and keyCode

```js
// src/index.js
Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  //...
  keys: {
    // switch left and right using the key
    ArrowLeft: 'right',
    ArrowRight: 'left',
    // switch up and down using the keyCode
    38: 'down',
    40: 'up',
    // register new handlers
    '.': 'dot', // dot() can now be used in the input object
    // key code for letter 's'
    83: 'search' // search() can now be used in the input object
  }
})
```

The custom keys object will be merged with the default key mapping, that looks like this:

```js
const defaultKeyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Enter: 'enter',
  ' ': 'space',
  Backspace: 'back',
  Escape: 'escape',
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  13: 'enter',
  32: 'space',
  8: 'back',
  27: 'escape',
}
```
