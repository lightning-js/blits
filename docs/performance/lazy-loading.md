# Lazy Loading with the :range Parameter

The for-loop in Blits comes with a [`:range` parameter](../built-in/for-loop.html#using-the-range-attribute) that allows you to render only a portion of an array rather than all the items.

This `:range` parameter can also be used to easily implement an efficient form of _lazy loading_. Lazy loading is a crucial concept for performance in TV applications where rails can contain hundreds of items, but only a small subset is visible at any time.

## Basic range implementation

For the basic syntax of the `:range` attribute, we typically set dynamic `from` and `to` values, which define the subset of items to display.

```js
<Tile :for="(item, index) in $items" :range="{from: $from, to: $to}" />
```

A full example of a Rail component with a range would look something like this:

```js
export default Blits.Component('RangedRail', {
  template: `
    <Element :x.transition="0 - $focused * 300">
      <Tile
        :for="(item, index) in $items"
        :range="{from: $range, to: $range + 7}"
        :key="$item.id"
        :focused="$focused"
        w="300"
        h="200"
        :x="$index * 320"
      />
    </Element>
  `,
  state() {
    return {
      range: 0,
      focused: 0,
      items: [] // Array of 100+ items
    }
  },
  input: {
    right() {
      this.focus = Math.min(this.focus + 1, items.length)
      this.range++
    },
    left() {
      this.focus = Math.max(this.focus - 1, 0)
      this.range--
    }
  }
})
```

Benefits of this approach are:

- **Selective Rendering**: Only items within the specified range are actually created as elements
- **Performance Optimization**: Reduces memory usage and improves rendering performance
- **Dynamic Range Updates**: The range can be computed based on user interaction and scroll position

A downside of this approach is that, as we scroll we are also **destroying** components that are out of range. And we may need those
same items when we scroll back (and thus recreate them). On top of that, destroying Components and Elements also comes at a cost.

## Lazy loading with the range attribute

We can solve the problem of destroying Components that we may want to use again by slightly changing the logic of the Rail component.

1) We set `from: 0`, to ensure we always start from the first item (and _keep_ the first items)
2) We use `to: $range + 7`  to render up to the current position plus a lookahead buffer
3) The `$range` value tracks how far the user has navigated through the rail, but it doesn't decrement when navigating back

With these changes a full example of a LazyRail component would look something like this:

```js
export default Blits.Component('LazyRail', {
  template: `
    <Element :x.transition="0 - $focused * 300">
      <Tile
        :for="(item, index) in $items"
        :range="{from: 0, to: $range + 7}"
        :key="$item.id"
        w="300"
        h="200"
        :x="$index * 320"
      />
    </Element>
  `,
  state() {
    return {
      range: 0,
      items: [] // Array of 100+ items
    }
  },
  input: {
    right() {
      this.focus = Math.min(this.focus + 1, items.length)
      // push the range update to the next tick to spread out the work
      // and ease the CPU a bit
      this.$setTimeout(() => this.range = this.focus)

    },
    left() {
      this.focus = Math.max(this.focus - 1, 0)
      // we don't decrement the range when scrolling back to keep components alive
      // this.range--
    }
  }
})
```

## Performance Benefits

Properly applying the range attribute provides **Memory Efficiency**:

- Instead of creating 100+ elements, only ~8-15 are active
- Reduces GPU memory usage on constrained TV hardware
- Lower overall memory footprint

It also is beneficial for **Faster Rendering**

- Initial page load only renders visible items
- Scroll performance improves as fewer elements need updates
- Reduced layout calculations


It **optimizes bandwidth**

- Images and assets only load for rendered items
- Reduces network requests on page load
- Progressive content loading


### Alpha Transitions

For a smoother experience you consider applying an alpha transition, that fades out items at the end of the rang.e

```js
:alpha.transition="$index <= $range ? 1 : ($index <= $range + 3 ? 0.8 : 0.6)"
```

This creates a dimming effect for previously viewed items while maintaining full opacity for the current and upcoming items.

## Best Practices

### Buffer Size

Use a buffer of 5-10 items ahead of current position:

```js
// Conservative buffer for low-end devices
:range="{from: $currentIndex - 1, to: $currentIndex + 6}"

// Larger buffer for smoother experience
:range="{from: $currentIndex - 2, to: $currentIndex + 10}"
```

## Performance Impact

On typical TV hardware:

- **Memory Usage**: 70-80% reduction compared to full rendering
- **Initial Load Time**: 3-5x faster page initialization
- **Scroll Performance**: Consistent fps maintained vs potential frame drops
- **Network Requests**: Reduced by 80-90% on initial load
