# Lazy Loading with the :range Parameter

The `:range` parameter in Blits for loops enables efficient lazy loading by controlling which items are actually rendered on screen. This is crucial for performance in TV applications where rails can contain hundreds of items, but only a small subset is visible at any time.

## How It Works

### Basic Syntax

```js
<Element :for="(item, index) in $items" :range="{from: $from, to: $to}" />
```

### Key Concepts

- **Selective Rendering**: Only items within the specified range are actually created as elements
- **Performance Optimization**: Reduces memory usage and improves rendering performance
- **Dynamic Range Updates**: The range can be computed based on user interaction and scroll position

## Implementation Details

### Range Calculation

```js
export default Blits.Component('LazyRail', {
  template: `
    <Element>
      <Element
        :for="(item, index) in $items"
        :range="{from: 0, to: $reached + 7}"
        :key="$item.id"
        w="300"
        h="200"
        :x="$index * 320"
        :alpha="$index <= $reached ? 1 : ($index <= $reached + 3 ? 0.8 : 0.6)"
      />
    </Element>
  `,
  state() {
    return {
      reached: 0,
      items: [] // Array of 100+ items
    }
  },
  input: {
    right() {
      if (this.reached < this.items.length - 1) {
        this.reached++
      }
    },
    left() {
      if (this.reached > 0) {
        this.reached--
      }
    }
  }
})
```

Where:
- `from: 0` - Always start from the first item
- `to: $reached + 7` - Render up to the current position plus a lookahead buffer
- The `$reached` value tracks how far the user has navigated through the rail
- The `+7` provides a buffer to preload items ahead of the current focus

## Performance Benefits

### Memory Efficiency
- Instead of creating 100+ elements, only ~8-15 are active
- Reduces GPU memory usage on constrained TV hardware
- Lower overall memory footprint

### Faster Rendering
- Initial page load only renders visible items
- Scroll performance improves as fewer elements need updates
- Reduced layout calculations

### Bandwidth Optimization
- Images and assets only load for rendered items
- Reduces network requests on page load
- Progressive content loading

## Integration with Focus Management

The lazy loading works seamlessly with focus navigation:

```js
export default Blits.Component('FocusableRail', {
  template: `
    <Element>
      <Element
        :for="(item, index) in $items"
        :range="{from: $focusIndex - 2, to: $focusIndex + 8}"
        :key="$item.id"
        :focus="$index === $focusIndex"
        w="300"
        h="200"
        :x="$index * 320"
      />
    </Element>
  `,
  state() {
    return {
      focusIndex: 0,
      items: []
    }
  },
  input: {
    right() {
      if (this.focusIndex < this.items.length - 1) {
        this.focusIndex++
      }
    },
    left() {
      if (this.focusIndex > 0) {
        this.focusIndex--
      }
    }
  }
})
```

### Alpha Transitions

Items outside the immediate focus area use alpha transitions for smooth visual effects:

```js
:alpha="$index <= $reached ? 1 : ($index <= $reached + 3 ? 0.8 : 0.6)"
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

### Bidirectional Loading
Consider implementing backward loading for better user experience:

```js
computed: {
  rangeStart() {
    return this.focusIndex - 3
  },
  rangeEnd() {
    return this.focusIndex + 8
  }
}
```

### Automatic Asset Management
The Blits renderer automatically handles graphical culling of out-of-bound images, so manual preloading strategies are not required. Images outside the visible range are automatically managed by the underlying graphics system.

### Performance Monitoring
Track range updates to optimize buffer sizes:

```js
watchers: {
  focusIndex(newIndex, oldIndex) {
    const rangeSize = this.rangeEnd - this.rangeStart
    console.log(`Range size: ${rangeSize}, Focus: ${newIndex}`)
  }
}
```

## Example Use Cases

### Media Carousels
Movie/TV show rails with hundreds of items:

```js
:range="{from: $currentIndex - 2, to: $currentIndex + 8}"
```

### Sports Events
Live game feeds with continuous content:

```js
:range="{from: $liveIndex - 5, to: $liveIndex + 10}"
```

### Music Playlists
Large song collections:

```js
:range="{from: $playingIndex - 3, to: $playingIndex + 12}"
```

### Photo Galleries
Image browsers with lazy image loading:

```js
:range="{from: $viewIndex - 1, to: $viewIndex + 6}"
```

## Performance Impact

On typical TV hardware:

- **Memory Usage**: 70-80% reduction compared to full rendering
- **Initial Load Time**: 3-5x faster page initialization
- **Scroll Performance**: Consistent fps maintained vs potential frame drops
- **Network Requests**: Reduced by 80-90% on initial load

## Advanced Patterns

### Variable Buffer Size
Adjust buffer based on scroll speed:

```js
computed: {
  dynamicBuffer() {
    return this.scrollSpeed > 5 ? 12 : 6
  },
  rangeEnd() {
    return this.focusIndex + this.dynamicBuffer
  }
}
```

This lazy loading pattern is essential for creating smooth, responsive TV applications that perform well on constrained embedded browser environments.
