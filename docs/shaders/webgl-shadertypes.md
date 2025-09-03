# WebGL ShaderTypes
With WebGL ShaderTypes you can define shaders that work for WebGL renderer. In order to create WebGL ShaderTypes a basic understanding of shaders is required, visit [`The Book of Shader`](https://thebookofshaders.com/01/) to discover more. The following properties are used in a WebGlShaderType:

## fragment
The fragment property is the only `required` property for the WebGLShaderType. This property needs a fragment shader source. This usually comes in a the form of a string.

```js
export const Default = {
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform sampler2D u_texture;

    varying vec4 v_color;
    varying vec2 v_textureCoords;

    void main() {
      vec4 color = texture2D(u_texture, v_textureCoords);
      gl_FragColor = vec4(v_color) * texture2D(u_texture, v_textureCoords);
    }
  `
}
```

You can also use a function that generates a fragment shader source based on the renderer and the configured props in the ShaderType.

```js
export const RadialGradient = {
  fragment(renderer, props) {
    return RadialGradientSource(renderer, props)
  }
}
```
View the actual code for generating the example code [here](https://github.com/lightning-js/renderer/blob/main/src/core/shaders/webgl/RadialGradient.ts).

### uniforms
You can use `uniform` values to alter what is rendered. There are some uniforms that the renderer passes automatically if they are defined in your fragment source;

```
uniform float u_alpha; //alpha of the node
uniform vec2 u_dimensions; //size of the node
uniform sampler2D u_texture; //the texture of the node
uniform vec2 u_resolution; //size of the stage or clipping rect of a parent node
uniform float u_pixelRatio; //pixel ratio used for current calculation
```

### varyings
You can also you `varying` values to alter what is drawn, these values are different per pixel. You can create `varying` values in a vertex shader, however the renderer exposes the following `varying` values by default:

```
varying vec4 v_color; //the premultiplied color with alpha
varying vec2 v_textureCoords; //textureCoordinates used to draw the texture (usually a value between 0 and 1)
varying vec2 v_nodeCoords; //coordinates within the node. similar to v_textureCoords a value between 0 and 1
```

## vertex
The vertex property is an `optional` property and generally only used if you are making more advanced shaders. With the vertex shaders you can alter the position where the node will be drawn, and you can use `attribute` values to fill `varying` values.

```js
export const Default = {
  vertex: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    attribute vec2 a_position;
    attribute vec2 a_textureCoords;
    attribute vec4 a_color;
    attribute vec2 a_nodeCoords;

    uniform vec2 u_resolution;
    uniform float u_pixelRatio;

    varying vec4 v_color;
    varying vec2 v_textureCoords;
    varying vec2 v_nodeCoords;

    void main() {
      vec2 normalized = a_position * u_pixelRatio;
      vec2 screenSpace = vec2(2.0 / u_resolution.x, -2.0 / u_resolution.y);

      v_color = a_color;
      v_nodeCoords = a_nodeCoords;
      v_textureCoords = a_textureCoords;

      gl_Position = vec4(normalized.x * screenSpace.x - 1.0, normalized.y * -abs(screenSpace.y) + 1.0, 0.0, 1.0);
      gl_Position.y = -sign(screenSpace.y) * gl_Position.y;
    }
  `
}
```

If you are interested in a more advanced version of a vertex shader view the following [source](https://github.com/lightning-js/renderer/blob/main/src/core/shaders/webgl/Shadow.ts)

## update
The update property is an `optional` property. It is generally used to update uniform values that are passed to the `fragment`/`vertex` when the is rendered.

```js
export const ColorBurn = {
  update() {
    //this is a WebGLCoreNode only function to make passing colors easier
    this.uniformRGBA('u_color', 0x00ff00ff);
  },
  fragment: `
    # ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    # else
    precision mediump float;
    # endif

    uniform sampler2D u_texture;

    varying vec4 v_color;
    varying vec2 v_textureCoords;

    uniform vec4 u_color;

    void main() {
      vec4 color = texture2D(u_texture, v_textureCoords);
      gl_FragColor = 1.0 - (1.0 - texture) / u_color;
    }
  `
}
```

If you are using props you can access these inside the update function:

```js
{
  props: {
    color: 0x00ff00ff,
  },
  update() {
    //this is a WebGLCoreNode only function to make passing colors easier
    this.uniformRGBA('u_color', this.props.color)
  }
}
```

You can also get information about the node during the update function:

```js
{
  update(node) {
    //creates a vec2 uniform
    this.uniform2f('u_halfSize', node.w / 2, node.h / 2)
  }
}
```

## canBatch
Generally the Renderer checks if the `Quad` that is supposed to be drawn can use the current shader with the loaded uniforms, we call this a `batch check`.
The Renderer has functions it runs by default to check if a shader can be batched or not, however with the `canBatch` property you can configure a function that compares two quads for difference.

> Note: The `canBatch` function overwrites default Renderer batch checks.

```js
{
  props: {
    size: 0,
  },
  canBatch(targetQuad, currentQuad) {
    if(targetQuad.width !== currentQuad.width) {
      return false
    }
    return true
  }
}
```
