# Hooking into Lifecycle Events

Blits components follow a defined flow of lifecycle events. You can integrate specific logic into these events by specifying them in the `hooks` key of the Component configuration object.

For each available lifecycle event, you can define a function with the same name as the event itself. This function will then execute each time the lifecycle event is triggered for your component's instance. It's essential to use a regular function instead of an arrow function if you intend to access the `this` scope of your component instance.

## Lifecycle Events

The following lifecycle events are available in Blits components.

- **init()**: This event fires when the component is being instantiated, just before it sends its render instructions to the Lightning renderer. At this point, the elements of your template won't be available yet.

- **ready()**: The `ready` event fires when the component instance is fully initialized and rendered, indicating that it's ready for interaction.

- **focus()**: This event triggers whenever the component instance receives focus. It's important to note that this event can fire multiple times during the component's lifecycle, depending on user interactions. After the `focus`-hook is called, a built-in state variable `hasFocus` is set to `true` on the component. This gives the convenience of using `$hasFocus` in your template (i.e. `<Element :color="$hasFocus ? 'red' : 'blue'" />`).

- **unfocus()**: The `unfocus` event fires whenever the component instance loses focus. Similar to the `focus` event, it can occur multiple times during the component's lifecycle. After the `unfocus`-hooks is invoked, the built-in state variable `hasFocus` is set to the default value `false`.

- **destroy()**: The `destroy` event fires when the component is being destroyed and removed. This event provides an opportunity to perform any custom cleanup operations before the component is removed.

```js
export default Blits.Component('MyComponent', {
  // ...
  hooks: {
    init() {
      // Logic to execute on init event
    },
    ready() {
      // Logic to execute on ready event
    },
    focus() {
      // Logic to execute on focus event
    },
    unfocus() {
      // Logic to execute on unfocus event
    },
    destroy() {
      // Logic to execute on destroy event
    },
  },
})
```

## Renderer events

In addition to the lifecycle events of Blits components, it is also possible hook into several _renderer_ events via the `hooks` key of the Component configuration object.

- **idle**: Fires when the renderer has finished rendering and enters an _idle_ state. This is a good moment to run logic (for example, sending telemetry data) without interfering with or blocking rendering. **Note**: In a typical app, this event will fire _multiple_ times. If it never fires, it may indicate that something is continuously animating (i.e., the renderer is constantly updating and never idle).

- **frameTick**: Fires on _every_ frame tick and receives an object with the frame's _time_ and _delta_. This event is useful when you need precise control over logic tied to specific frame ticks. **Note**: It fires _every_ frame (up to 60 times per second), so expect many invocations of the frameTick callback and use with care.

- **fpsUpdate**: Fires at a predefined interval ([fpsInterval](../essentials/settings.md), which defaults to `1000ms`) and reports the current FPS value.

```js
export default Blits.Component('MyComponent', {
  // ...
  hooks: {
    idle() {
      // Logic to execute on idle event
    },
    frameTick(data) {
      console.log(data.time, data.delta)
    },
    fpsUpdate(fps) {
      console.log('Current FPS', fps)
    },
  },
})
```
