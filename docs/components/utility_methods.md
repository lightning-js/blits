# Utility methods

Besides the methods that are specified in the Component configuration object, each Blits Component comes with a number of
_utility methods_ built in.

Utility methods are prefixed with a `$`-sign, to clearly indicate they are _framework provided_ methods, that are _not private_, but
intended to be _used by the developer_. The `$`-prefix also helps prevent accidental naming collisions.

### $select

`this.$select()` is used to search for child Elements and Components by reference (`ref`).

The `$select()`-method accepts a string pointing to a reference as it's only argument, and returns the Element or Component that
matches that `ref`. In order to make an Element or Component findable, the `ref`-attribute should be provided on said Element of Component
in the template.

```js
export default Blits.Component('MyComponent', {
  components: {
    Button,
  },
  template: `
    <Element>
      <Element w="1920" h="5" color="green" ref="topBorder" />
      <Button text="Button 1" ref="btn1" y="100" />
      <Button text="Button 2" ref="btn2" y="200" />
      <Button text="Button 3" ref="btn3" y="200" />
    </Element>
  `,
  hooks: {
    ready() {
      const topBorderElement = this.$select('topBorder')
      const button2 = this.$select('btn2')
    }
  }
})
```

> As the `this.$select()` gives direct access to an Element or a Component, it allows the developer to directly interact with it. There are valid use cases, but direct manipulation of Elements, calling methods and changing properties on a Component comes with risks. It circumvents the whole structure of reactivity and props communication built into Blits, and can lead to unexpected situations or anti-patterns. So use with care!

### $focus

The `$focus()`-method can be used to set the focus to a Component instance. It can either be called on the instance itself, in order to "claim"
the focus. But more often it will be used to delegate the focus from on Component to another.

> It is important to understand that only a Component can receive focus in Blits. Elements don't have a focus method, and also have no way of reacting to focus changes (because they have no hooks etc.).

Often focus will be passed onto a child component, for example in the case of a list or swimlane, where you want to delegate the focus to a poster.
In this case the focus method will be used in combination with `this.$select()` to first select the desired child Component by ref, and subsequently call the `$focus()` method on that Component.

```js
export default Blits.Component('MyComponent', {
  components: {
    Button,
  },
  template: `
    <Element>
      <Element w="1920" h="5" color="green" ref="topBorder" />
      <Button text="Button 1" ref="btn1" y="100" />
      <Button text="Button 2" ref="btn2" y="200" />
      <Button text="Button 3" ref="btn3" y="200" />
    </Element>
  `,
  state() {
    focusIndex: 1
  },
  input: {
    down() {
      this.focusIndex--
      const button = this.$select(`btn${this.focusIndex}`)
      if(button) {
        button.$focus()
      }
    },
    up() {
      this.focusIndex++
      const button = this.$select(`btn${this.focusIndex}`)
      if(button) {
        button.$focus()
      }
    },
  }
})
```

Another frequent case is that focus is passed on to the parent Component. The parent component is available on the Component scope as `this.$parent`. So passing the focus to the parent is as simple as calling `this.$parent.$focus()`.

The `$focus`-method accepts an optional `event` parameter, which is of the type `KeyboardEvent`. When the `event` parameter is provided, not only will the selected Component receive focus, but the input event will be emitted again on the component that just received focus.

This can be used to _bubble up_ input events (specified in the `input` key of the component configuration object) and helps to create a smooth experience, preventing a user to click multiple times.

When a Component receives focus the `focus` lifecycle-hook is invoke. Additionally the built in state variable `$hasFocus` is set from `false` to `true`.

#### Focus chain

It's worth noting that the when a Component is _focused_ it's parents will _also_ be set to focused as part of the _focus chain_. Each parent will have it's `focus` lifecycle-hook invoked and the `$hasFocus` state variable will be set to true.

When moving the focus to a different Component, all components that are in a focused state, but are not part of the new _focus chain_ to said Component will be put into `unfocus` state (i.e. `unfocus` lifecycle hook is invoked and `$hasFocus` is set to `false`). For shared ancestors of the new Component to gain focus, the `focus` lifecycle hook is _not_ called again.

#### Refocus

When the `$focus` method is called on a Component that is already is a focused state (either because it is the focused Component, or becasue it's an ancestor of the focused Component, and thus part of a focus chain) it is essentially being _refocused_. In this case the `focus`-lifecycle hook is invoked again, making sure that _focus_ functionality is executed.

> Tip: a _refocus_ can be distinguished from a _fresh focus_, by checking the value of the  built-in `$hasFocus` state variable. In the event of a refocus the `$hasFocus` is already set to `true` when invoking the `focus`-hook. When it's a fresh focus the value is `false`.

### $input

The `$input()`-method handles keyboard events on a component **without changing focus**. It works similarly to `$focus()`, but for input handling instead of focus management.

**Comparison with `$focus()` methods:**
- `this.parent.$focus()` - Changes focus to parent **ONLY** (no event parameter = no bubbling)
- `this.parent.$focus(e)` - Changes focus to parent **AND** bubbles the event (with event parameter)
- `this.parent.$input(e)` - Handles the input event on parent **ONLY** (no focus change)

Both `this.parent.$focus(e)` and `this.parent.$input(e)` process events on the parent. The difference is that `$focus()` changes focus, while `$input()` only handles the input event.

**When to use `$input`:**
Use this when you need another component (like a parent) to handle the key but want to keep focus on the current component.

The `$input()`-method accepts one parameter: the `event` (KeyboardEvent), which is the keyboard event to handle. The key name is automatically extracted from the event using the configured keymap.

The method returns `true` if the component or any parent component handled the event, or `false` if no handler was found.

```js
export default Blits.Component('MyComponent', {
  input: {
    enter(e) {
      // Handle the enter key locally
      this.doSomething()
      
      // Also let parent handle it without changing focus
      this.parent.$input(e)
    },
    back(e) {
      // Let parent handle back key, but keep focus here
      if (this.parent.$input(e)) {
        // Parent handled it
        return
      }
      // No parent handler, handle it ourselves
      this.handleBack()
    },
    space(e) {
      // Handle input on a component selected by ref
      const menu = this.$select('mainMenu')
      if (menu) {
        menu.$input(e)
      }
    },
  }
})
```

> **Note**: The `$input()` method works on the component it's called on (like `$focus()`), so call it on the target component (e.g., `this.parent.$input(e)` or `this.$select('ref').$input(e)`) to handle input on that component without changing focus.

### $trigger

Blits has reactivity built-in, which means that re-renders in the template, as well as watchers and computed properties, are automatically fired whenever a state value changes. But sometimes you may want trigger the side effects of a state values change, without actually changing the value. This often is useful when a Component first receives focus and you want to ensure that the default state values are applied.

Instead of setting a value to `null` and then setting it back to the initial value (which would trigger side effects), the `this.$trigger()` method can be used. The method accepts the name of the state variable as its argument.

```js
export default Blits.Component('MyComponent', {
  state() {
    focusIndex: 1
  },
  watchers: {
    focusIndex(v) {
      console.log('I trigger when focusIndex changes')
    }
  },
  hooks: {
    focus() {
      // even though focusIndex didn't change
      // the watcher on focusIndex will be fired
      this.$trigger('focusIndex')
    }
  }
})
```

## Emitting events and passing data

### $emit

When working with Components in Blits you will often want to send data from one to another. In the case of (direct) child Component, using
props is the defacto way for inter-component communication.

For passing data from a child to a parent component, you may be tempted to use the `this.$parent` reference and change the state directly. While this works, it does create a strict dependency on the parent, meaning the child Component only works properly when tied directly to a specific parent. This reduces reusability of Components and may cause limitations or problems later on.

Instead the `this.$emit()` method can be used, which is available on each Component as a utility function. It's designed to easily emit data to anywhere in an App. The first argument is the `name` of the event that will be emitted (i.e. `changeBackground`) and optionally a second argument with additional `data` can be passed.

```js
export default Blits.Component('MyComponent', {
  input: {
    enter() {
      // sending a activate event, without any additional data
      this.$emit('activate')
    },
    space() {
      // sending a changeBackground event, with additional data
      this.$emit('changeBackground', {
        img: './assets/background1.jpg',
        delay: 400
      })
    }
  }
})
```

#### Emitting data by reference

When emitting a data object via de `$emit()`-method, the object will be passed _by reference_. This is default behaviour in JavaScript. As a result of this, when emitted data is manipulated in the `$listen` method, the original object is _also_ changed.

With plain objects this is usually not a problem, but when you emit component `state` objects or `props`, you have to be aware that you may be reassigning an already reactive object or are updating an object that has reactive side effects attached to it.

In these cases it could be helpful to not pass the original state or prop object (i.e. `this.items`) directly and / or as a whole, but instead _clone_ that object. Or construct a completely new data object with only those values required, at the moment of emitting.

You can also have Blits handle this for you and pass the optional 3rd `byReference` parameter to the `$emit()`-method. By setting this to `false` the default JS behaviour of passing objects by reference will be bypassed and the object will be recursively cloned and cleaned from any potential reactivity before emitting - allowing you to safely interact with the emitted data after.

Note that this recursive operation comes at a cost, especially when emitting large deep-nested data structures, at high frequency - evaluate per use case whether this may cause a performance issue or not.


```js
// explicitely _not_ passing this.navigationResult by reference
this.$emit('setMenuItems', this.navigationResult, false)
```

### $listen

The `$listen` utility method (which is available on each Blits Component) is designed to listen for events emitted by `this.$emit()`.
Any Component can subscribe to any event emitted and as such a flexible system of passing data around can be constructed.

The first argument of the `$listen()`-method is the event `name` to listen for, and the second argument is a `callback` to be executed
anytime the event occurs. When the event is emitted with additional data, it's passed as the first argument in the callback.

Generally the listeners are registered in the Component `ready` or `init` hook. Blits automatically takes care of deregistering the listeners whenever a Component is destroyed.

```js
export default Blits.Component('MyComponent', {
  hooks: {
    init() {
      // activate event without any additional value
      this.$listen('activate', () => {
        console.log('activated')
        // set a text state value
        this.text = 'We are active!'
      })

      // change background event
      this.$listen('changeBackground', (data) => {
        setTimeout(() => {
          this.backgroundImage = data.img
        }, data.delay)
      })
    },
  }
})
```

### $unlisten

The `$unlisten` utility method (which is available on each Blits Component) is designed to remove event listeners that were previously registered using `$listen()`. This method helps in managing event listeners manually when needed.

The first argument of the `$unlisten()` method is the event `name` to stop listening for. This ensures that all listeners for the specified event are removed from the component.

Generally, you might not need to call `$unlisten()` manually, as Blits automatically deregisters listeners when a Component is destroyed. However, it can be useful in scenarios where you need to stop listening for events before the Component is destroyed.

```js
export default Blits.Component('MyComponent', {
  hooks: {
    init() {
      this.activateListener = () => {
        console.log('activated')
        this.text = 'We are active!'
      }

      this.changeBackgroundListener = (data) => {
        setTimeout(() => {
          this.backgroundImage = data.img
        }, data.delay)
      }

      // Register listeners
      this.$listen('activate', this.activateListener)
      this.$listen('changeBackground', this.changeBackgroundListener)
    },
    unfocus() {
      // Remove listeners when Component is unfocused
      this.$unlisten('activate')
      this.$unlisten('changeBackground')
    }
  }
})
```

### $clearListeners

The `$clearListeners` utility method (available on each Blits Component) is designed to remove all event listeners registered on the component via $listen(). This method is useful when you want to ensure that the component stops listening to all events at once, rather than removing them individually with `$unlisten()`.

> Note: there is no need to manually remove listeners when destroying a component. The Blits teardown mechanism will ensure that listeners are removed in this case.

```js
export default Blits.Component('MyComponent', {
  hooks: {
    init() {
      this.$listen('activate', () => {
        console.log('activated')
        this.text = 'We are active!'
      })

      this.$listen('changeBackground', (data) => {
        setTimeout(() => {
          this.backgroundImage = data.img
        }, data.delay)
      })
    },
    unfocus() {
      // Remove all listeners when Component is unfocused
      this.$clearListeners()
    }
  }
})
```

## Timeouts

Setting a timeout is a typical way in JS to execute functionality with a delay. But timeouts can also be a common cause of
memory leaks.

As long as the timeout is still pending it, it will hold on to references which can prevent a proper garbage collection from happening. That's why it's important to clear timeouts when destroying a component.

Blits comes with some built-in methods to register and clear timeouts. Under the hood these methods use regular timeouts, but using the Blits built-in methods ensures that timeouts properly are cleared whenever a component is being disposed.

### $setTimeout

The `this.$setTimeout()`-method creates a timeout, using a thin wrapper around the `window.setTimeout()` method. The first argument is the `callback` to be executed after the `delay` specified in the second argument. The method returns a `timeout id`, which can be used to mannually clear the timeout.

### $clearTimeout

The `this.$clearTimeout()`-method is a thin wrapper around the `window.clearTimeout()`-method. By passing in the `id` of a timeout, it will clear and remove the timeout.

### $clearTimeouts

The `this.$clearTimeouts()`-method is a utility method that is used to clear all the timeouts created via the `this.$setTimeout()` method in one go. The method doesn't require to pass any timeout ids. This method is automatically called when destroying a Component, and with that it prevents memory leaks due to dangling timeouts.

```js
export default Blits.Component('MyComponent', {
  state() {
    timeout: null
  },
  hooks: {
    init() {
      this.timeout = this.$setTimeout(() => {
        console.log('1 minute has passed!')
      }, 60000)

      this.$setTimeout(() => {
        console.log('10 seconds have passed!')
      }, 10000)
    },
    unfocus() {
      // clear all timeouts when Component is unfocused
      this.$clearTimeouts()
    }
  },
  input: {
    enter() {
      // clear the timeout
      this.$clearTimeout(this.timeout)
    }
  }
})
```

## Intervals

Timeouts are a great way to execute recurring logic, such as polling for updates or periodically updating an animation.

But similar to timeouts, intervals (more specifically failing to clear them) are a common source of memory leaks - maybe even more than dangling timeouts.

For this reason Blits has 3 built-in utility methods to help registering and clearing intervals.

### $setInterval

The `this.$setInterval()`-method create an interval, using a thin wrapper around the `window.setInterval()` method. The first argument is the `callback` to be executed after each interval `delay` specified in the second argument. The method returns an `interval id`, which can be used to manually clear the interval.

### $clearInterval

The `this.$clearInterval()`-method is a thin wrapper around the `window.clearInterval()`-method. By passing in the `id` of an interval, it will clear and remove the interval.


### $clearIntervals

The `this.$clearIntervals()`-method is a utility method that is used to clear all the intervals created via the `this.$setInterval()` method in one go. The method doesn't require to pass any interval ids. This method is automatically called when destroying a Component, and with that it prevents memory leaks due to dangling intervals.

```js
export default Blits.Component('MyComponent', {
  state() {
    return {
      interval: null,
      secondCount: 0,
      minuteCount: 0,
    }
  },
  hooks: {
    init() {
      this.interval = this.$setInterval(() => {
        this.secondCount++
        console.log(`${this.secondCount} second(s) have passed`)
      }, 1000)

      this.$setInterval(() => {
        this.minuteCount++
        console.log(`${this.minuteCount} minute(s) have passed`)
      }, 60000)
    },
    unfocus() {
      // clear all intervals when Component is unfocused
      this.$clearIntervals()
    }
  },
  input: {
    enter() {
      // clear the interval
      this.$clearInterval(this.interval)
    }
  }
})
```

## Debounce

Debouncing is a technique to limit the rate at which a function executes. This is particularly useful when navigating through lists or handling rapid user input, where you want to execute a method only after the user has stopped the action for a specified delay.

Similar to timeouts and intervals, debounced functions can cause memory leaks if not properly cleaned up. Blits provides built-in debounce methods that automatically handle cleanup when a component is destroyed.

### $debounce

The `this.$debounce()`-method creates a debounced function that delays execution until after a specified delay has passed since the last invocation. If the same name is debounced again before the delay completes, the previous debounce is cancelled and a new one is created.

The first argument is a `name` (string) that uniquely identifies this debounce instance within the component. The second argument is the `callback` function to execute. The third argument is the `delay` in milliseconds. Additional arguments can be passed and will be forwarded to the callback function.

The method returns a `debounce id`, which can be used to manually clear the debounce.

**Key Features:**
- **Name-based**: Each debounce is identified by a unique name (unique per component instance)
- **Automatic replacement**: Calling `$debounce` with the same name replaces the previous debounce
- **Memory efficient**: Only stores debounce IDs internally, function is captured in closure
- **Automatic cleanup**: All debounces are cleared when component is destroyed

### $clearDebounce

The `this.$clearDebounce()`-method clears a specific debounce by its name. This prevents the debounced function from executing.

### $clearDebounces

The `this.$clearDebounces()`-method clears all debounces registered on the component in one go. This method is automatically called when destroying a Component, preventing memory leaks due to dangling debounce timers.

```js
export default Blits.Component('ListComponent', {
  state() {
    return {
      items: [],
      currentIndex: 0
    }
  },
  input: {
    down() {
      // Debounce navigation - only load data after 300ms of no navigation
      this.$debounce('navigate', () => {
        this.loadCurrentItem()
      }, 300)
    },
    up() {
      // Different debounce for different operation
      this.$debounce('update', () => {
        this.updateUI()
      }, 200)
    }
  },
  methods: {
    loadCurrentItem() {
      // This will only execute after 300ms of no navigation
      const item = this.items[this.currentIndex]
      // ... load item data
    },
    updateUI() {
      // This will only execute after 200ms of no update calls
      // ... update UI
    }
  },
  hooks: {
    unfocus() {
      // Optionally clear all debounces when component loses focus
      this.$clearDebounces()
    }
  }
})
```
