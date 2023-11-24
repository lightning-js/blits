---
prev:
  text: Component state
  link: component_state
next:
  text: Props
  link: props
---

# Hooking into Lifecycle Events

In Blits, components follow a defined flow of lifecycle events. Developers can integrate their logic into these events by specifying them in the `hooks` key of the Component configuration object.

For each available lifecycle event, you can define a function with the same name as the event itself. This function will execute each time the event is triggered for your component's instance. It's essential to use a regular function instead of an arrow function if you intend to access the `this` scope of your component instance.

## Lifecycle Events

- **init()**: This event fires when the component is instantiated, just before it sends its render instructions to the Lightning renderer. At this point, the elements of your template won't be available yet.

- **ready()**: The `ready` event fires when the component instance is fully initialized and rendered, indicating that it's ready for interaction.

- **focus()**: This event triggers whenever the component instance receives focus. It's important to note that this event can fire multiple times during the component's lifecycle, depending on user interactions.

- **unfocus()**: The `unfocus` event fires whenever the component instance loses focus. Similar to the `focus` event, it can occur multiple times during the component's lifecycle.

- **destroy()**: The `destroy` event fires when the component is being destroyed and removed. This event provides an opportunity to perform any custom cleanup operations before the component is removed.

## Example

```javascript
{
  // Other component configurations...
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
};
```

In the provided example, each function within the `hooks` object corresponds to a specific lifecycle event, allowing developers to inject custom logic at different stages of the component's lifecycle.
