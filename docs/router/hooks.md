# Router Hooks

The Blits router supports hooks that allow you to execute code at specific points during the navigation process.

Hooks are defined per route in the optional `hooks` key within the Route configuration object.

> Currently, the Blits router only supports the before hook, with additional hooks planned for future releases.

## Before hook

The before hook is executed before the navigation occurs. It can be used for checks, such as verifying user authentication for a specific route, for pre-fetching data, or for executing logic like sending stats beacons.

The before hook is defined as a function that receives 2 arguments: the Route object that is being navigated `to`. And the Route object that is being navigated away `from`.

```js
export default Blits.Application({
  // ...
  routes: [
      {
        path: '/',
        component: Home,
        hooks: {
          before(to, from) {
            // custom logic
          }
        }
      }
  ],
  // ...
})
```

The before hook can optionally return a value, which will influence the behaviour of the route change:

- when  `false` is returned, the router will fail to finish the routing, and act as if _no matching route was found_
- when a `string` is returned, the router will interpret this a _new route path to redirect to_
- when an `object` is returned, the router will interpret this as a route object, allowing to _modify (or completely replace) the route object_ being navigated to

Returning an `object` is a simple, yet powerful, mechanism to add advanced runtime configuration to your routes. A common scenario is to overwrite certain parts of the route object provided in the `to`-argument, such as the route options (such as `inHistory` or `stayAlive`) or define conditional page transitions.

It's also possible to add custom data to the route object in the `key` object. Custom data should be an object literal. When the new page loads, the keys in the `data` object are injected into the Component as `props`.

```js
export default Blits.Application({
  // ...
  routes: [
      {
        path: '/video/details/:id',
        component: Details,
        hooks: {
          before(to, from) {
            // redirect to an error page when id is not a number
            if(isNaN(to.params.id)) {
              return '/not-valid'
            }
            // set a different transition when navigating from home page
            if(from && from.path === '/home') {
              to.transition = slideInTransition
            }
            // add custom data
            to.data.title = 'Hello World'
            // finally return the modified route object
            return to
          }
        }
      }
  ],
  // ...
})
```
