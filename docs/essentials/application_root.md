# Application root

Every Blits App starts with a base Application component.

Ultimately this Application is a component like any regular Blits component. But it is augmented with some extra functionality. `Blits.Application` is responsible for setting up the listeners for keyhandling for example.

You can only have 1 Application component per App. By default, this file is named `App.js` and it is placed in the root of the `src`-folder.

`src/App.js` will look something like this:

```js
import Blits from '@lightningjs/blits'

export default Blits.Application({
  template: `
    <Element></Element>
   `,
})
```
