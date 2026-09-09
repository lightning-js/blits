# Animations

From Blits version DBD, this frameworks comes with built-in [Animejs](https://animejs.com/) integration.

### What does that mean?

Since Blits is mostly used to create TV apps that may run on devices with low capabilities we have integrated the Animejs update in sync when the Render engine updates, this might differ per device f.e; 30fps, 60fps, 120fps, etc. We've also implemented four of the commonly used Animejs functions and added it to the `Component`, this ensures that these animation actions are canceled when a component is destroyed.

### How to use

Below you can find which Animejs functions are implemented into Blits. Note that every header has a link to the animejs documentation page, please use these links to find more in-depth information regarding; playback settings, properties, methods, etc.

After the functions section there will be some Blits specific tips and tricks that you can checkout before creating advanced animations.

## Timer [link](https://animejs.com/documentation/timer)

Schedules and controls timed callbacks that can be used as an alternative to `$setTimeout()` or `setInterval()`, keeping animations and callbacks synchronized.

Animejs implementation:

```js
import { createTimer } from 'animejs';

Blits.Component('Example', {
  hooks: {
    ready() {
      const timer = createTimer(parameters);
    }
  }
})
```

Blits implementation:

```js
Blits.Component('Example', {
  hooks: {
    ready() {
      const timer = this.$timer(parameters)
    }
  }
})
```

## Animate [link](https://animejs.com/documentation/animation)

Animates the properties values of targeted elements, with a wide range of parameters, callbacks and methods.

Animejs implementation:

```js
import { animate } from 'animejs';

Blits.Component('Example', {
  hooks: {
    ready() {
      const animate = animate(target, parameters);
    }
  }
})
```

Blits implementation:

```js
Blits.Component('Example', {
  hooks: {
    ready() {
      const animate = this.$animate(target, parameters)
    }
  }
})
```

## Timeline [link](https://animejs.com/documentation/timeline)

Synchronises animations, timers, and callbacks together.

Animejs implementation:

```js
import { createTimeline } from 'animejs';

Blits.Component('Example', {
  hooks: {
    ready() {
      const timer = createTimeline(parameters);
    }
  }
})
```

Blits implementation:

```js
Blits.Component('Example', {
  hooks: {
    ready() {
      const timer = this.$timeline(parameters)
    }
  }
})
```

## Animatable [link](https://animejs.com/documentation/animatable)

Efficiently animates target properties, making it an ideal replacement for `$animate()` in situations where values change frequently, such as cursor events or animation loops.

Animejs implementation:

```js
import { createAnimatable } from 'animejs';

Blits.Component('Example', {
  hooks: {
    ready() {
      const animate = createAnimatable(target, parameters);
    }
  }
})
```

Blits implementation:

```js
Blits.Component('Example', {
  hooks: {
    ready() {
      const animate = this.$animatable(target, parameters)
    }
  }
})
```

## Targets

Specify the elements or objects to which property changes must be applied. And are used in Timelines, Animatables and Animations.

In Blits this parameter can be a `string`, an `object`, or an `array` with a combination of the two.

In native Animejs code the `string` is a CssSelector in Blits we don't use CSS so when using a string in Blits it will asume that the target is a `ref` element;

```js
Blits.Component('Example', {
  template: `
    <Element>
      <Element ref="myEl" />
    </Element>
  `,
  hooks: {
    ready() {
      const animate = this.$animate('myEl', parameters)
    }
  }
})
```

## Callbacks

When using callbacks make sure you define them as the paremeters property and not apply them when the animation has been made, this ensures that the underwater code is not cleared when you do so.

```js
// ✅ DO:
const animate = this.$animate('myEl', {
  onBegin: () => {

  }
})

// ❌ NEVER: Apply callbacks later
const animate = this.$animate('myEl', parameters)
animate.onBegin = () => {
  //code
}
```


## Easings

You can use Animejs easings easily by importing them from Animejs, you will however have to manually install Animejs if you haven't already:

```terminal
npm install animejs
```

```js
import { cubicBezier } from 'animejs'

Blits.Component('Example', {
  hooks: {
    ready() {
      const animate = this.$animatable(target, {
        ease: cubicBezier(0, 0, 3, 44)
      })
    }
  }
})
```

See [link](https://animejs.com/documentation/easings) for more applicable ease methods!
