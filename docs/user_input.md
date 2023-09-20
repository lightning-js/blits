# Blits - Lightning 3 App Development Framework

## Handling User Input

You don't want your Lightning 3 App to be completely static, instead users should be able to navigate and interact with the app, often using devices like a remote control.

Blits offers a straightforward interface to handle user input for each component.

### Configuring Input Handling

Within the Component configuration object, the `input` key is utilized to define how the component should react to specific key presses when it has focus. It should contain an object of functions that specify the actions to take based on key presses.

Each function should correspond to a key name, such as `up`, `down`, `enter`, `space`, `back`, `1`, `2`, `a` etc. Each function defined in the `input` object receives the full `InputEvent` object as its first argument.

```javascript
{
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

If the currently focused component does not handle a key press, the framework will traverse up the component hierarchy, checking if any parent components have defined functions for that key press in their `input`-object. This event handling chain continues until it reaches the root Application.

When a component handles a key press by having a corresponding function specified, the event handling chain stops by default. However, if you want the input event to propagate up the hierarchy, you can set focus to the parent element and pass the `InputEvent` object on in the function call.

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

To allow a focused component to respond to any key and act as a catch-all, you can add an `any()` function to the input object.

```javascript
{
  input: {
    any() {
      // Logic to execute for any key press
    },
  }
}
```
