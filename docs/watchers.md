# Blits - Lightning 3 App Development Framework

## Watching for Changes

In some cases, you may want to execute specific actions whenever the value of a state variable, a prop, or a computed property changes. These actions could involve dispatching an event or updating another state variable.

You might be tempted to handle this functionality inside a computed property, but this is not recommended. Computed properties should not have side effects, as side effects could potentially lead your app into an endless loop if not handled carefully.

Instead, Blits allows you to specify **watchers**.

### Using Watchers

Within the `watch` key of the Component configuration object, you can define an object of _watcher functions_.

The name of each function should correspond to the name of the internal state variable, prop, or computed property that you want to watch. Whenever the target value changes, the respective watcher function will be invoked.

The watcher function receives two arguments: the new value and the old value of the observed property. This allows you to perform specific actions based on the changes.

### Example:

```javascript
{
  state() {
    return {
      alpha: 0.2
    }
  },
  watch: {
    alpha(value, oldValue) {
      if(value > oldValue) {
        // Execute some logic when the 'alpha' value increases
      }
    },
  }
}
```

In this example, whenever the 'alpha' value changes, the watcher function associated with 'alpha' will be invoked. The function checks if the new value is greater than the old value and executes custom logic accordingly.
