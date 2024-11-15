# Router Transitions

Page transitions add a layer of visual polish to your application by animating the change between routes.

When the router in Blits navigates to a new page, it automatically applies a subtle _fade-in / fade-out_ transition. Blits also allows to specify custom transitions on a per-route basis.

## Defining Route Transitions

In the Route object, the `transition` key can be used to specify which transition should be applied when navigating _to_ that route.

It accepts a _Transition_ object, with 3 optional keys: `before`, `in`, `out`.

### Before

The `before` key is used to set a property to a certain value _before_ the page transition starts. The properties are set on the page that is being navigated _to_. For example, it can be used to position the page out of screen by setting the `x` value to a negative value, in order to create a _slide in from the right_ effect. Or the `alpha` property can be set to `0` if you want to create a _fade-in_ effect.

```js
const pageTransition = {
  // position the new page outside the screen on the left side
  before: {
    prop: 'x',
    value: -1920
  }
}
```

In order to set multiple properties to an initial state, an Array of objects can be assigned to the `before` key.

```js
const pageTransition = {
  // position the new page outside the screen on the left side
  // and set the alpha to 0
  before: [{
    prop: 'x',
    value: -1920
  },{
    prop: 'alpha',
    value: 0
  }]
}
```

### In

The `in`-key is used to define how the new page should transition _into_ the screen, given the initial defaults, in combination with any properties set in the optional `before` key.

The transition is defined by a _Transition_ object, consisting of:

- `prop` - the property to apply the transition on
- `value` - the value to transition to
- `duration` (optional) - the duration of the transition in milliseconds (defaults to `300ms`)
- `easing` (optional) - the easing function applied to the transition (defaults to `ease-in`)

```js
const pageTransition = {
  // position the new page outside the screen on the left side
  before: {
    prop: 'x',
    value: -1920
  },
  // transition the new page from outside, into the screen
  in: {
    prop: 'x',
    value: 0,
    duration: 800,
    easing: 'cubic-bezier(0.20, 1.00, 0.80, 1.00)'
  }
}
```

In order to transition multiple properties, an Array of objects can be assigned to the `in` key.

```js
const pageTransition = {
  // position the new page outside the screen on the left side
  // and set the alpha to 0
  before: [{
    prop: 'x',
    value: -1920
  },{
    prop: 'alpha',
    value: 0
  }],
  // transition the new page from outside, into the screen
  // and transition the alpha from 0 to 1
  in: [{
    prop: 'x',
    value: 0,
    duration: 800,
    easing: 'cubic-bezier(0.20, 1.00, 0.80, 1.00)'
  },{
    prop: 'alpha',
    value: 1,
    duration: 500,
  }]
}
```

### Out

Finally the `out`-key is used to define how the old page should transition _out of_ the screen.

Similar to the `in`-transition, the `out`-transition is defined by a _Transition object_, consisting of:

- `prop` - the property to apply the transition on
- `value` - the value to transition to
- `duration` (optional) - the duration of the transition in milliseconds (defaults to `300ms`)
- `easing` (optional) - the easing function applied to the transition (defaults to `ease-in`)

And in order to transition multiple properties at the same time during the _out_ transition, an Array of transition objects can be supplied.


```js
const pageTransition = {
  // position the new page outside the screen on the left side
  // and set the alpha to 0
  before: [{
    prop: 'x',
    value: -1920
  },{
    prop: 'alpha',
    value: 0
  }],
  // transition the new page from outside, into the screen
  // and transition the alpha from 0 to 1
  in: [{
    prop: 'x',
    value: 0,
    duration: 800,
    easing: 'cubic-bezier(0.20, 1.00, 0.80, 1.00)'
  },{
    prop: 'alpha',
    value: 1,
    duration: 500,
  }],
  // slide up the old page
  // while rotating
  out: [{
    prop: 'y',
    value: -1080
  },{
    prop: 'rotate',
    value: 720
  }]
}
```
