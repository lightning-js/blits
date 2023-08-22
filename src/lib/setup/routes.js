export default (component, routes) => {
  component.prototype.___routes = []
  Object.keys(routes).forEach((key) => {
    // todo: validate routes[key] for expected format etc.
    component.prototype.___routes[key] = routes[key]
  })
}
