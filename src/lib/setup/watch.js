export default (component, watchers) => {
  component.prototype.___watchKeys = []
  component.prototype.___watchers = {}

  for (let watch in watchers) {
    if (typeof watchers[watch] !== 'function') {
      console.warn(`${watch} is not a function`)
    }

    component.prototype.___watchKeys.push(watch)

    component.prototype.___watchers[watch] = function (v, old) {
      watchers[watch].call(this, v, old)
    }
  }
}
