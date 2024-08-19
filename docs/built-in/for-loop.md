# For loop

The for loop is technically also a [directive](../directives.md), but such an important one that it deserves it's own section.

The for loop directive can be used when you want to repeat multiple instances of an Element or a Component, without having to specify them hardcoded one by one in your template.

The for loop take an `Array` of data, loops over it and for each Array-item an Element or Component is created. The `Array` can be a fixed one, but it' can also dynamically be filled or modified and have it's changes reflect in the rendered result.

> Important: the for loop is a powerful and often used directive. Within Blits it's optimized to be as performant as possible. But if used incorrectly, it can be the cause of slow performance. So please read carefully through this entire section.


## Basic syntax

The for-loop directive should be added as an attribute on the Element or Component that you want to repeat for each item in your Array. In the template syntax a `for ... in` construct is used. This ultimately transpiles down to a classic, optimized for loop.

```js
export default Blits('ForLoop', {
  template: `
    <Element>
      <Element :for="item in $items" w="100" h="100" color="lime" />
    </Element>
  `,
  state() {
    return {
      items: ['Item 1', 'Item 2', 'Item 3']
    }
  },
})
```

The example above will generate 3 _lime green_ elements, based on the array of `items` in the Component state. They will appear on top of each other though, since they have no `x` and `y` positioning (which default to 0).


## Using the index

In order to fix the example above and make all 3 elements visible, we can use the `index` of the Array, to position each item correctly.

All we need to do is declare the `index` in the `for`-directive and subsequently use it in the the `x`-attribute, with a simple calculation.

You may choose any name for the `index` variable (like `i` or `forIndex`). This may be useful when you already have the `index`-key specified as a `state` or `prop` variable on your component, causing a conflict.

```js
export default Blits('ForLoop', {
  template: `
    <Element>
      <Element :for="(item, index) in $items" w="100" h="100" color="lime" :x="$index * 150" />
    </Element>
  `,
  state() {
    return {
      items: ['Item 1', 'Item 2', 'Item 3']
    }
  },
})
```

You will now see that each Element is positioned next to each other, with a 50px space in between.


## Using variables inside a for loop

When iterating over an Array in the for loop, you can reference the current Array item under the name specified in the for-in construct, prefixed with a `$`-sign. Besides this scoped Array item context, you _also_ have access to any `prop`, `state` or `computed` variable as you loop over an Array.

Consider the example below, that loops over an array of _Objects_, and _also_ references the `alpha` state variable.

```js
export default Blits('ForLoop', {
  template: `
    <Element>
      <Element
        :for="(item, index) in $items"
        w="100"
        h="100"
        :color="$item.color"
        :x="$index * 150"
        alpha="$alpha"
      />
    </Element>
  `,
  state() {
    return {
      alpha: 0.5,
      items: [{
        id: 1,
        color: 'green'
      }, {
        id: 2,
        color: 'blue'
      }, {
        id: 3,
        color: 'yellow'
      }]
    }
  },
})
```

This will generate 3 squares aligned next to each other, each with a differrent color and they will use the _alpha_ specific in the Component state.

## The importance of using the key attribute

The examples above have demonstrated the basic usage of the for-loop. But they are all missing one _very important_ ingredient to make sure that for-loops that are subject to change, continue to perform well. Meet the `key`-attribute.

For perfomance reasons, it is essential to be able track the _identity_ of an Element or Component, whenever changes are made to the Array in the for loop.

Think of _identity_ as the field that makes an item in the Array unique, such as an `id` or a `hash`. It's basically the thing that allows you to distinguish between the poster of _The Matrix_ and the poster of _Frozen 2_, for example.

Providing this information, allows the for-loop to decide whether it should _update_ an existing Component or Element instance. Or whether we're dealing with a new Array item, and a new instance should be _created_.

Correctly using the `key`-attribute enables Blits to _reuse_ existing instances whenever possible - which obviously is good for performance.

It's important that the `key`-attribute is _unique_ for each Array item. Also beware that we can't rely on the `index` parameter provided in for loop, because that only indentifies the position in the Array, and not the actual item itself.


```js
export default Blits('ForLoop', {
  template: `
    <Element>
      <Element
        :for="(item, index) in $items"
        w="100"
        h="100"
        :color="$item.color"
        :x="$index * 150"
        alpha="$alpha"
        key="$item.id"
      />
      <!-- ^^ id is the unique field that identifies each array item -->
    </Element>
  `,
  state() {
    return {
      alpha: 0.5,
      items: [{
        id: 1,
        color: 'green'
      }, {
        id: 2,
        color: 'blue'
      }, {
        id: 3,
        color: 'yellow'
      }]
    }
  },
  hooks: {
    ready() {
      let count = 3
      this.$setInterval(() => {
        this.items.push({id: count++, color: randomColor()})
      }, 2000)
    }
  }
})
```

In the example above we have added the `key`-attribute in the template. Now whenever we push a new item to the `items`-array, the for-loop will reuse the Elements previously created and only instantiate a new Element for the newly added item.

If we would ommit the `key`-attribute, then whenever we push a new item to the Array, the for-loop would dispose all the old Elements and create new instances for _each_ item in the array.

## Referencing elements in the for loop

When you specify a `for`-attribute on an Element or a Component, it will effectively create multiple Elements / Components depending
on the length of the Array.

Generally it's not recommended to access and interact directly with Elements in a template, and that also goes for items in a For loop. But in some cases you may need to, for example to delegate focus to a specific item in the For loop.

The `ref`-attribute can be used in combination with the `for`-attribute as well.

Setting the _ref_ in a for loop context, can be done by either passing a string (i.e. `myitem`) and as Elements get generated in the for loop, the `index` value will be appended to it (i.e. `myitem0`, `myitem1`, etc.). Alternatively you can make the attribute interpolated and define the value for each item yourself (i.e. `:ref="'item' + $item.id"`).
