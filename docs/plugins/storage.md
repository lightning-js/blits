# Storage

Occasionally, you may want to persist data inside your App. By default, the browser's localStorage is used for that purpose. However, if localStorage is not supported by the platform, it automatically falls back to *Cookies*.

Please note that the Cookie size is limited to 4096 Bytes.

## Usage

If you need to persist data inside your App, import Blits Storage plugin from Blits:

```js
import Blits from '@lightningjs/blits'
Blits.Storage.get('<key>')
```

## Available methods

### set

Saves a key-value combination in storage.

```js
Blits.Storage.set(key, value)
```

The key is expected to be a `String`. The value can be a `String`, `Object`, `Boolean` or `Array`.

When saved, the value is automatically converted to a JSON object, so you do not have to call `JSON.stringify()` on objects yourself.

### get

Retrieves previously stored data from storage.

```js
Blits.Storage.get(key)
```

If you stored an `Object`, the data is automatically converted back to an Object, so you do not have to call `JSON.parse()` yourself.

### remove

Removes a specific key from storage.

```js
Blits.Storage.remove(key)
```

### clear

Removes *all* data from storage.

```js
Blits.Storage.clear()
```
