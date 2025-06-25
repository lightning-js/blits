# Watchers

In some cases, you may want to execute specific actions whenever the value of a state variable, a prop, or a computed property changes. These actions could involve dispatching an event or updating another state variable.

You might be tempted to handle this functionality inside a computed property, but this is not recommended. Computed properties should not have side effects, to prevent the risk of falling into an endless loop.

Instead, Blits allows you to specify **watchers** to trigger functionality when certain variables change.

## Using Watchers

Within the `watch` key of the _Component configuration object_, you can define an object of _watcher functions_.

The name of each function should correspond with the name of the state variable, the prop, or the computed property that you want to observe. Whenever the value of the observed target changes, the respective watcher function will be invoked.

The watcher function receives two arguments: the _new value_ and the _old value_ of the observed property. This allows you to perform specific actions based on the changes.

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

In this example, whenever the value of state variable `alpha` changes, the `alpha` watcher function will be invoked. The function checks if the new value is greater than the old value and executes custom logic accordingly.

## Watching nested states

You can also define watchers for nested component states using dot notation to separate each attribute. This allows for deep-watching functionality while maintaining performance on low-resource devices.

```javascript
{
  state() {
    return {
      size: { w: 0, h: 0 }
    }
  },
  hooks: {
    ready() {
      this.size = { w: 200, h: 200 };
    }
  },
  watch: {
    'size.h'(h: number) {
      // Execute some logic when the 'size.h' value changes
    },
  }
}
```

In this example, whenever the value of the state variable attribute `size.h` changes, the `size.h` watcher function will be invoked.
