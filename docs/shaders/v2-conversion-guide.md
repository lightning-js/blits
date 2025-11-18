# v2 Conversion Guide
This is a conversion guide for changing the use of the `effects` attribute to the new `shader` system introduced in `v2`.

There has been quite a few changes in order to make the use of shaders less performance heavy. The system the Renderer used to make these effects cost us a lot of performance, and for this reason was discontinued. This comes with bunch of changes for Blits too, we covered most basic uses but some others might require a bit more time to make it work again. This guide helps you getting started with converting the effect attribute to the new built-in attributes.

Please take a look at the following [link](../essentials/element_attributes.md#shaders) to familiarize yourself with the new attributes.

We'll start with the easiest conversions, and later on tackle the more complicated conversions.

## Built-in
Here are some examples on changing common used effects to built-in `shader attributes`.

### Radius
Radius has been with a `rounded` attribute:

```xml
<Element :effects="[{type: 'radius', props: {radius: 44}}]" />
<!-- To -->
<Element rounded="44" />
```

### Border
Border still uses the name `border` and has its own attribute:

```xml
<Element :effects="[{type: 'border', props: {width: 20, color: '#60a5fa'}}]" />
<!-- To -->
<Element border="{w: 20, color: '#60a5fa'}" />
```

### Combining Radius & Border
You can combine built-in attributes:

```xml
<Element :effects="[{type: 'radius', props: {radius: 10}}, {type: 'border', props: {width: 20, color: '#60a5fa'}}]" />
<!-- To -->
<Element rounded="10" border="{w: 20, color: '#60a5fa'}" />
```

### linearGradient
To use the `linearGradient` you have to use the `shader` attribute:

```xml
<Element :effects="[{type: 'linearGradient', ...props}]" />
<!-- To -->
<Element shader="{type: 'linearGradient', ...props}" />
```

### radialGradient
To use the `radialGradient` you have to use the `shader` attribute:

```xml
<Element :effects="[{type: 'radialGradient', ...props}]" />
<!-- To -->
<Element shader="{type: 'radialGradient', ...props}" />
```

### holePunch
To use the `holePunch` you have to use the `shader` attribute:

```xml
<Element :effects="[{type: 'holePunch', ...props}]" />
<!-- To -->
<Element shader="{type: 'holePunch', ...props}" />
```

## Built-in Advanced
Some combinations that were available in `effects` are not available anymore in the same `Element`. However you can make use of nested elements to recreate some effects.

To do this we have to make use of the `rtt` attribute available in Blits. This renders everything within an `Element` to a texture.

> [!WARNING]
> The use of rtt comes with extra performance costs.

For example if you have a tile with `radius` and an image and a `linearGradient` overlay. You can do the following:

```xml
<Element rounded="20" rtt="true">
  <Element src="./image.jpg" shader="{type: 'LinearGradient', ...props}"/>
</Element>
```

```xml
<Element rounded="20" rtt="true">
  <Element src="./image.jpg" shader="{type: 'LinearGradient', ...props}"/>
</Element>
```

You can also nest `shader` attributes:

```xml
<Element shader="{type: 'holePunch', ...props" rtt="true">
  <Element src="./image.jpg" shader="{type: 'LinearGradient', ...props}"/>
</Element>
```

## Custom Conversion
Don't want to make use of the `rtt` attribute? You can create your own Shader Type to alter your node. You can start by reading into [importing shaders](./importing-shaders.md), and [webgl](./webgl-shadertypes.md) Shader Types.

Following are a couple examples on how to combine your own shaders:

### Rounded + Linear Gradient
To create a shader like this, start by getting the [source](https://github.com/lightning-js/renderer/blob/main/src/core/shaders/webgl/Rounded.ts) of the Rounded shader from the Renderer repository.

You will use this as a base to add the `linearGradient` effect onto. ([source](https://github.com/lightning-js/renderer/blob/main/src/core/shaders/webgl/LinearGradient.ts))

For this example we used a fixed amount of color stops to make the example a more readable.

Now that you have the base code for our shader you can start adding the `linearGradient` related uniforms and functions.


```glsl
//...default rounded uniforms, varyings, functions

//add linearGradient uniforms
//angle in degrees
uniform float u_angle;
uniform float u_stops[3];
uniform vec4 u_colors[3];

vec2 calcPoint(float d, float angle) {
  return d * vec2(cos(angle), sin(angle)) + (u_dimensions * 0.5);
}

vec4 linearGradientColor(vec4 colors[3], float stops[3], float angle) {
  //line the gradient follows
  float lineDist = abs(u_dimensions.x * cos(angle)) + abs(u_dimensions.y * sin(angle));
  vec2 f = calcPoint(lineDist * 0.5, angle);
  vec2 t = calcPoint(lineDist * 0.5, a + PI);
  vec2 gradVec = t - f;
  float dist = dot(v_textureCoords.xy * u_dimensions - f, gradVec) / dot(gradVec, gradVec);

  float stopCalc = (dist - stops[0]) / (stops[1] - stops[0]);
  vec4 colorOut = mix(colors[0], colors[1], stopCalc);
  colorOut = mix(colorOut, colors[2], clamp((dist - stops[1]) / (stops[2] - stops[1]), 0.0, 1.0));
  return colorOut;
}

//...main function
```

Now that we've added this, we can start using the `linearGradientColor` in the main function of the fragment shader. We'll focus on this part:

```glsl
vec4 resColor = vec4(0.0);
resColor = mix(resColor, color, roundedAlpha);
gl_FragColor = resColor * u_alpha;
```

What you want to alter is the color value. This contains the color of a Node, or the color of a texture. You want to overlay the gradient color on top of this value:

```glsl
vec4 gradient = linearGradient(u_colors, u_stops, u_angle);
color = mix(color, gradient, clamp(gradient.a, 0.0, 1.0));
vec4 resColor = vec4(0.0);
resColor = mix(resColor, color, roundedAlpha);
gl_FragColor = resColor * u_alpha;
```

Now you have a shader with a LinearGradient overlay on top of a texture or default color, and rounded corners.

### Borders + Linear Gradient
Want a border to have a gradient effect? You can use the same principle we used earlier with the rounded version. Checkout the Border [source](https://github.com/lightning-js/renderer/blob/main/src/core/shaders/webgl/Border.ts) and add the LinearGradient stuff you added to the Rounded shader. Once you've added this you can alter the border color from:

```glsl
vec4 resColor = mix(u_borderColor, color, innerAlpha);
gl_FragColor = resColor * u_alpha;
```

to

```glsl
vec4 gradient = linearGradient(u_colors, u_stops, u_angle);
vec4 bColor = mix(u_borderColor, gradient, clamp(gradient.a, 0.0, 1.0));
vec4 resColor = mix(bColor, color, innerAlpha);
gl_FragColor = resColor * u_alpha;
```
