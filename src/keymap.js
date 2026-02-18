/**
 * Merged keyMap (default + custom settings).
 * Initialized once during application init.
 * @type {Object<string, string>}
 */
let keyMap = {}

export default {
  get: () => keyMap,
  set: (newKeyMap) => {
    keyMap = newKeyMap
    return keyMap
  },
}
