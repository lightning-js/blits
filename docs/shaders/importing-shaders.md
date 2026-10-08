# Custom Shaders
Along with the built-in shader attributes Blits provides, you can also create your own shaders, to do this you'll have to define a `ShaderType`.

## ShaderType basics
A ShaderType is a configuration object the renderer needs to create a shader node and optionally extra programs to make it actually render something on the screen.

Any basic ShaderType can consist of the following optional properties

### props
Similar to Blits props, you can use specific values to alter the way an effect is rendered by the renderer. The main difference between the Blits props and ShaderType props is that theses props need a default value, therefor you can only use objects.

```js
const ShaderType = {
  props: {
    foo: 1,
    fooToo: {
      default: 1,
    }
  }
}
```

#### pointer props
You can also use "pointer" props to adjust other props. This is handy in cases you use arrays as value f.e;

```js
const ShaderType = {
  props: {
    foo: [0, 0, 0, 0],
    fooOne: {
      set(v, props) {
        props.foo[1] = v;
      },
      get(props) {
        return props.foo[1]
      }
    }
  }
}
```

### getCacheMarkers
In some cases you might want to generate code based on the props you pass when using a specific ShaderType.

## ShaderTypes for different render modes
The Renderer that Blits uses makes use of different ShaderTypes for each render mode, [webgl](./webgl-shadertypes.md) or [canvas](./canvas-shadertypes.md). Blits(and the Renderer) by default use `webgl` ShaderTypes.

## Including ShaderTypes to your project
You can register ShaderTypes in the Launch settings of your App (in `src/index.js`). The `shaders`-key in the settings is an `Array` that specifies your custom shaders in your App.

```js
  shaders: [
    // ...
    {
      name: 'myshader', // shader name - used in Element Attribute
      type: MyShaderType, // ShaderType object.
    },
    // ..
  ],
```



