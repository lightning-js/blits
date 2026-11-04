# Slots

Slots allow you to pass elements and components into a child Component's template. This is useful for reusable components, such as a card that provides a background and layout, while its parent supplies the content.

## Default slots

Add a `<Slot />` to your Component's template to define where the content should appear. In the parent template, place the content between the Component's opening and closing tags:

```js
// src/components/Card.js
import Blits from '@lightningjs/blits'

export default Blits.Component('Card', {
  template: `
    <Element w="300" h="200" color="#475569" rounded="20">
      <Slot x="20" y="20" />
    </Element>
  `,
})
```

After importing and registering `Card` under the parent Component's `components` key, you can use it like this:

```html
<Card>
  <Text content="Hello from the parent!" />
</Card>
```

The `Text` is rendered inside the slot, with its position relative to the slot's `x` and `y` coordinates.

## Named slots

For components with multiple content areas, give each slot a `ref`. The parent can then use the `slot` attribute to send content to the matching slot.

For example, update the card's template to include a separate slot for a footer:

```html
<Element w="300" h="200" color="#475569" rounded="20">
  <Slot x="20" y="20" />
  <Slot ref="footer" x="20" y="150" />
</Element>
```

The parent can now supply both the main content and the footer:

```html
<Card>
  <Text content="Today's highlights" />
  <Text slot="footer" content="View all" />
</Card>
```

Content without a `slot` attribute is inserted inside the first `<Slot />` declared in the Component's template. In the example above, this is the unnamed `<Slot x="20" y="20" />`. Keep this default slot before any named slots.

If the Component has no slots defined, the content is inserted inside the top level wrapper Element of its template.
