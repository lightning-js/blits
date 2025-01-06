# Layout

A big portion of building a pixel perfect App is all about correctly positioning Elements and Components on screen. In Lightning and Blits _absolute_ positions are used. This fits the whole concept of building a TV app where the viewport dimensions are known and fixed. Absolute positioning (versus spacing Elements relative to each other) is also more performant.

Imagine a complex design with several nested layers. Relying solely on _relative_ positioning and elements automatically floating as space is available, may lead to heavy and recursive calculations. Then throw some dynamically changing dimensions and animations in the mix as well, and your App may be starting to noticeably drop frames due to expensive re-calculations.

That being said, there are often cases where it becomes very cumbersome to calculate all the positions manually. Especially when dimensions are not known in advance and elements may load asynchronously.

If you come from a CSS background, you may be tempted to say: "_this is why we have Flexbox!_". And while Flexbox is great and versatile in CSS and running on a powerful device, a full flexbox implementation does come at a cost and the risk of slowing down your App, when applied extensively or incorrectly.

In order to address the core problem "_how do I easily position a bunch of Elements and Components, without writing a lot of code with `@loaded` event handlers_", Blits offers the built-in `<Layout>`-component - a basic and performant solution that automatically puts your Elements in the right place.

## How to use

Since the Layout-component is a built-in component, there is no need to register it separately. You can use the `<Layout>`-tag anywhere in your templates, just as you would use `<Element>` and `<Text>`.

The Layout component is a wrapper component, that encloses a number of children. All the direct children that are wrapped in a `<Layout>`-tag are automatically positioned in order, one next to the other.

Whenever the dimensions of a child change, the positioning of the next children is automatically recalculated and re-applied.

```xml
<Layout>
  <Element w="40" h="40" color="red" />
  <Element w="80" h="40" color="blue" />
  <Text>Hello world</Text>
  <Element w="40" h="40" color="green" />
</Layout>
```

### Horizontal and vertical layout

By default the Layout component lays out it's contents _horizontally_. The Layout component accepts a `direction` attribute which allows you to control the direction.

In order to align vertically use `<Layout direction="vertical"></Layout>`. And use `<Layout direction="horizontal"></Layout>` to explicitly apply the default horizontal layout.

### Spacing between children

By default the Layout-component places each Element directly besides (or below) the previous one. By adding the `gap`-attribute you can control how much space will be added between each Element or Component. The `gap`-attribute accepts a number in pixels.

### Aligning items

The layout component positions its children based on the provided direction (`horizontal` or `vertical`). With the `align-items`-attribute you can specify how to align the children on the opposite axis:

- `start` (the default value) - aligns the children in the _top_ for horizontal layouts, and on the _left_ for vertical layouts
- `center` - align the children in the center
- `end` - aligns the children in the _bottom_ for horizontal layouts, and on the _right_ for vertical layouts

### Dynamic dimensions

For the Layout component to work properly, the direct children all need to have dimensions (i.e `w` and `h` attributes). The exception here being Text elements.

Due to the asynchronous nature of rendering text, the final text dimensions are not known beforehand. The width and height of Text elements are automatically set when the text has been loaded. This fires a `@loaded` event, that you can tap into as described [here](../essentials/displaying_text#text-dimensions).

The Layout component also uses this event, to execute its calculation and position the text and other elements around it properly.

When the children of the Layout-component have _reactive_ dimensions (i.e. `<Element :w="$mywidth" :h="$myheight" />), the Layout component ensures that all child elements are properly re-positioned whenever a dimension changes.

### Components inside a Layout

It is also possible to place Components inside of a Layout, but there is a small _gotcha_ there. By default a Component does not have any dimensions - it has a width and height of `0`, regardless of the contents of the Component. Normally, when using absolute positioning, this isn't a problem. But in the context of a Layout, each child needs to have dimensions.

If the Component has fixed dimensions, you can just add a `w` and a `h` attribute to the Component tag (i.e. `<MyButton w="100" h="40" />`). This is the most performant way to supply dimensions to a Component and should be used whenever possible.

If the Component has dynamic dimensions that are not known upfront, you can dynamically update the dimensions from inside the Component by calling the `this.$size()`-method. This method accepts an object as its argument with a `w` property for setting the _width_ and a `h` property for setting the _height_.

```js
export default Blits.Component('MyButton', {
  template: ``,
  props: ['type'],
  hooks: {
    ready() {
      if(this.type === 'large') {
        this.$size({
          w: 200,
          h: 80
        })
      } else {
        this.$size({
          w: 100,
          h: 40
        })
      }

    }
  }
})
```
At this moment Blits does not have support for automatically growing the dimensions of a Component based on it's contents, because of the performance impact that this functionality has.

### Nesting Layouts

It's also possible to nest layouts. Simply place a new `<Layout>`-tag, with it's own children in between the children of another Layout-component. The Layout-component itself will grow automatically with the dimensions of it's children. In other words, it's not required to specify a width (`w`) or height (`h`) on the `<Layout>`-tag itself.

And of course you can nest _vertical_ Layouts inside a _horizontal_ one - and vice versa.

### Padding

By default a `<Layout />`-tag will be resized to the exact dimensions as the content it is containing. The `padding`-attribute can be used to add spacing between the content and the edges of the Layout Component.

The `padding`-attribute accepts a `number` or an `object`. When passed a number, that padding will be applied equally to all sides. With an object value, the padding can be controlled for each side individually.

Valid keys in the _padding-object_ are: `top`, `bottom`, `left`, `right`, `x` and `y`. The `x` and `y` keys can be used to define the same values for `top` and `bottom`, and `left` and `right` in one go. When a value is not specified for a side, it will default to `0`.

```xml
<Layout color="silver" padding="10" >
  <Element w="40" h="40" color="red" />
  <Element w="80" h="40" color="blue" />
  <Element w="40" h="40" color="green" />
</Layout>
```

```xml
<Layout color="silver" padding="{x: 20, top: 30, bottom: 10}">
  <Element w="40" h="40" color="red" />
  <Element w="80" h="40" color="blue" />
  <Element w="40" h="40" color="green" />
</Layout>
```

### Transitioning layouts

The `<Layout>`-component can also take into account when dimensions of children change with a transition applied to it (i.e. `<Element :w.transition="$myWidth">`). The component will recalculate the position of its children as the transition progresses, making sure that elements are always perfectly positioned relative to one another.

### Updated event

The `<Layout>`-tag automatically updates its dimensions based on the dimensions of its children. After each update in the children, the an `updated`-event is emitted on the `<Layout>`-tag. It will receive the current dimensions of the layout.

You can tap into this event by adding an `@updated`-attribute to the `<Layout />`-tag and refer to a method in your Component logic.


```js
export default Blits.Component('LayoutUpdate', {
  template: `
    <Element>
      <Layout @updated="$layoutUpdate">
        <Element :w="$width" h="40" color="red" />
        <Element :w="$width" h="40" color="blue" />
        <Element :w="$width" h="40" color="green" />
      </Layout>
    </Element>
  `,
  methods: {
    layoutUpdate(dimensions, el) {
      console.log(`Layout (${el.nodeId}) dimensions updated! Width: ${dimensions.w}, Height: ${dimensions.h}`)
    }
  }
})
```

> Please be aware that the `@updated` event can fire multiple times. The size of the Layout-tag is recalculated for each change in children. Also note that the `@updated` event does not guarantee a change in dimensions. It is possible that it fires for a children update, but remains the same size.

## Performance

The Layout-component is a very useful utility, that will make it a lot easier to put together complex layouts. It will reduce the code required, it means less hardcoding of values and removes the need to manually wire up `@loaded` events when working with dynamic / asynchronous elements.

We've done our best to make the Component as performant as possible, by deliberately keeping it simple and straight forward. But it's important to understand that the Layout component does come at a cost. Depending on the use case these costs may be negligible, but there are cases where the Layout component might prove to be a bottle-neck.

The performance costs may always be there to some degree. Whether it's the Layout component that does the complex calculations, or you do it in your custom code. So please feel encouraged to use the `<Layout>`-tag!

Some pointers to keep in mind, though:

- Every change in the dimensions of a child, triggers the Layout component to recalculate and reposition. If your child elements change frequently, the Layout component may have a performance impact.

- The Layout component support transitions, but beware that when transitioning child dimensions a recalculation happens every frame-tick. If you see frame-drops in your App, you may want to see if the `<Layout>`-tag has an impact on this.

- Be mindful to not apply unnecessary deep nesting of Layout tags. Each change in a deep child, will trigger recalculations up the tree of Layout tags.

- When using the `<Layout>`-tag with a for-loop, it may be more performant to use the `$index` of the for-loop and manually position the elements yourself (i.e. `<Element :for="(item, index) in $items" :$x="$item * 200" w="150" h="150" />`). Especially if the dimensions are know before hand and possibly are the same for each child.
