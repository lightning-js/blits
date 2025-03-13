# Canvas ShaderTypes
The [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) does not really have a concept called shaders, however for it to fit better into our architecture we are calling it shaders anyway. You can use the following properties to define your `CanvasShaderType`.

## render
The render property is the only `required` property for the CanvasShaderType. This property requires a function that draws the shader/effect.

```js
export const Border = {
  render(ctx, quad, renderContext) {
    //renders node context(if not called the context won't be drawn)
    renderContext()

    ctx.strokeStyle = 'green'
    ctx.lineWidth = 10
    ctx.beginPath()
    //draw an innerBorder
    ctx.strokeRect(
      quad.tx + 5,
      quad.ty + 5,
      quad.width - 10,
      quad.height - 10
    )
  }
}
```

## update
The update property is an `optional` property. We can use to computed and store some values we don't want to calculate / mutate everytime a quad is drawn with canvas.

```js
export const Border = {
  props: {
    color: 0x00ff00ff,
    width: 20
  },
  update() {
    this.computed.borderColor = formatRGBAtoString(this.props.color)
  },
  render(ctx, quad, renderContext) {
    //renders node context(if not called the context won't be drawn)
    renderContext()
    const borderWidth = this.props.width
    ctx.strokeStyle = this.computed.borderColor
    ctx.lineWidth = borderWidth
    const halfW = borderWidth * 0.5;
    ctx.beginPath()
    //draw an innerBorder
    ctx.strokeRect(
      quad.tx + halfW,
      quad.ty + halfW,
      quad.width - borderWidth,
      quad.height - borderWidth
    )
  }
}
```

## saveAndRestore
Generally when you are about to transform shape, rotation or clip with canvas methods you use `ctx.save` > apply methods > `ctx.restore`. Saving and restoring is very costly if used a lot. To reduce save and restore calls there is a property called `saveAndRestore` you can use to let the renderer know you need it to save and restore before and after this shader is executed.

```js
export const Rounded = {
  render(ctx, quad, renderContext) {
    const path = new Path2D();
    roundRect(
      path,
      quad.tx,
      quad.ty,
      quad.width,
      quad.height,
      this.computed.radius!,
    );
    ctx.clip(path);
    //renders node context(if not called the context won't be drawn)
    renderContext()
  }
}
```
See following source to learn more about the Rounded canvas shader.

You might still want to use `ctx.save` and `ctx.restore` in your render function. But this is only done when you want to more effects on top of a node. Just be careful not to overuse it.
