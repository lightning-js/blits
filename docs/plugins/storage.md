# Storage plugin

Occasionally, you may want to persist data inside your App. By default, the browser's localStorage is used for that purpose. However, if localStorage is not supported by the platform, it automatically falls back to *Cookies*.

Please note that the Cookie size is limited to 4096 Bytes.

## Registering the plugin

The Storage plugin is part of the core Blits package, but it's an optional plugin that needs to be registered in the App's `index.js`,
as demonstrated in the example below.

Make sure to place the `Blits.Plugin()` method _before_ calling the `Blits.Launch()` method

```js
// index.js

import Blits from '@lightningjs/blits'
// import the storage plugin
import { storage } from '@lightningjs/blits/plugins'

import App from './App.js'

// Use the Blits Storage plugin
Blits.Plugin(storage)


Blits.Launch(App, 'app', {
  // launch settings
})
```

Within the application we can call the storage plugin methods as below

```
this.$storage.get(key, value)
```

## Available methods

### set

Saves a key-value combination in storage.

```js
this.$storage.set(key, value)
```

The key is expected to be a `String` or a `Number`. The value can be a `String`, `Object`, `Boolean`, `Number` or `Array`.

When saved, the value is automatically converted to a JSON object, so you do not have to call `JSON.stringify()` on objects yourself.

### get

Retrieves previously stored data from storage.

```js
this.$storage.get(key)
```

If you stored an `Object`, the data is automatically converted back to an Object, so you do not have to call `JSON.parse()` yourself.

### remove

Removes a specific key from storage.

```js
this.$storage.remove(key)
```

### clear

Removes *all* data from storage.

```js
this.$storage.clear()
```
