# Mouse Support

Blits can use the mouse for _hover_ and _click-to-focus_ on the canvas. This is useful for web or hybrid (TV and web) apps. Mouse support is _opt-in_ and does not change behavior when disabled.

_Hover_ means the pointer is over a component (you can react with visual feedback or lifecycle hooks). _Focus_ is which component receives key input; a mouse click both focuses a component and sends an Enter key event to it.

## Enabling mouse support

Set `enableMouse: true` in the settings object passed to `Blits.Launch()`. That call is typically in your main entry file (e.g. `src/index.js`). The full list of launch settings is in [Application settings](../essentials/settings.md).

```js
// e.g. in src/index.js
Blits.Launch(App, document.getElementById('app'), {
  w: 1920,
  h: 1080,
  enableMouse: true,
})
```

When `enableMouse` is `true`:

- **Hover:** Moving the pointer over the canvas updates which component is hovered. Components receive the `hover` and `unhover` lifecycle events and the built-in `$isHovered` state.
- **Click:** A click focuses the component under the cursor and dispatches an **Enter** key event to it, so your existing `input.enter` handlers run.

When `enableMouse` is `false` (the default), no mouse or pointer listeners are added.

## Hover state and lifecycle

When the pointer moves over the canvas, Blits hit-tests the scene and sets the hovered component. Only one component is hovered at a time (the leaf under the cursor). Move events are throttled (about once every 100ms) to limit updates. When the pointer moves off the canvas or over empty space, hover is cleared.

Hover applies only to **components**, not to individual `Element` nodes. A component must have **dimensions** to be hoverable: set `w`/`h` on the component tag, or on the root element of the template, or set them dynamically with `this.$size()`.

- **Lifecycle:** The component (and its ancestors along the hover chain) receive a `hover` event when the pointer enters, and `unhover` when it leaves or moves to another component. These are lifecycle hooks; you can define `hover()` and `unhover()` in the `hooks` key of your component config.
- **State:** Each component has a built-in reactive property `$isHovered` — `true` while that component is hovered, `false` otherwise. In JavaScript use `this.$isHovered`; in your template use `$$isHovered`.

**Note:** The `hover` and `unhover` hooks and the `$isHovered` state only apply when `enableMouse` is `true`. Use a regular function (not an arrow function) in your hooks if you need to access the component's `this` scope.

```js
export default Blits.Component('Card', {
  template: `
    <Element
      :color="$$isHovered ? 0x4488ff : 0x222222"
    />
  `,
  state() {
    return {}
  },
  hooks: {
    hover() {
      // Pointer entered this component
    },
    unhover() {
      // Pointer left this component
    },
  },
})
```

For the full list of lifecycle events including `hover` and `unhover`, see [Hooking into Lifecycle Events](./lifecycle_events.md).

## Click-to-focus and Enter

When the user _clicks_ on the canvas:

1. If there is a component under the cursor, it receives focus (`$focus()`).
2. A synthetic **Enter** key event is dispatched to that component via `$input()`, so the same logic as pressing Enter (e.g. `input.enter`) runs.

If the click is over empty space (no component at that position), the click is ignored.

A click is therefore equivalent to: focus this component, then press Enter. Your existing [input handling](./user_input.md) for `enter` works for both remote and mouse.

```js
export default Blits.Component('Button', {
  input: {
    enter() {
      this.doAction()
    },
  },
  // ...
})
```

If the user clicks the button with the mouse, `doAction()` runs just as when the button has focus and the user presses Enter.

## Interaction with keyboard and focus

- **Keyboard clears hover:** When mouse is enabled, any _key press_ clears the current hover state. Focus and key handling then drive the UI; hover is only active while the user is moving the pointer.
- **Single focus:** Focus is still singular. Hover is independent: you can have a hovered component and a different focused component until a key is pressed (then hover is cleared).

## App-level mouse move event

When `enableMouse` is true, the Application component emits a `mouse::move` event on each throttled pointer move (same throttle as hover, about 100ms). You can listen in the root App hooks for custom behavior (e.g. custom cursor, analytics):

```js
export default Blits.Application({
  hooks: {
    init() {
      this.$listen('mouse::move', (e) => {
        // e is the MouseEvent (clientX, clientY, etc.)
      })
    },
  },
})
```

## Requirements and notes

- **Renderer:** Mouse hit-testing uses the Lightning renderer's `stage.getNodeFromPosition()`. The canvas must be in the DOM; Blits listens to `resize` and `scroll` when mouse is enabled to keep the canvas rect up to date.
- **No touch events:** Only mouse events are wired; touch is not translated to hover or click in this implementation.
- **Destroyed components:** Hover and click ignore components that are end-of-life or destroyed.
