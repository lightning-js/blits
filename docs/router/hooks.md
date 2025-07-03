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
- when a `string` is returned, the router will interpret this as a _new route path to redirect to_
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

## Global router hooks

Besides router hooks per route, as In the previous section, it is also possible to define _global_ hooks that are applicable to all routes / the router as a whole.

In order to configure global router hooks the `routes` key in the Application configuration object should be wrapped inside a `router` key.

Alongside the `router.routes` key we can now define a `router.hooks` object, which can have any of the following pre-defined hook functions:

### `beforeEach()`

Similar to the `before`-hook, the `beforeEach`-hook will be execute for every router navigation. This can be useful if you find yourself repeating the same functionality for many routes, for example an _authentication check_ or sending _telemetry_.

The `beforeEach`-hooks functions the same as the `before`-hook. It receives the route being navigated to as its first argument and the route navigated from as the second. And it can also optionally return a value, which will influence the behaviour of the route change as explained in the previous section.

### `init()`

The `init`-hook is a router hook that will be invoked once when defined when the router is being instantiated. It can be used to do some onetime setup, required before starting the routing.

The `init`-hook can be an asynchronous function. In this case the router will await the init function to resolve before comencing the first navigation.

### `error()`

The `error`-hook is a router hook that will be invoked when an error has occured. For example when routing to a non-existing route. It will receive an error message and the developer is free to implement any error handling functionality in this hook. This can be showing an Error popup, or navigating to a predefined 404 Not found route using the `this.$router.to()` method.


```js
export default Blits.Application({
  // ...
  router: {
    // array with routes wrapped in router key
    routes: [
        {
          path: '/video/details/:id',
          component: Details,
        }
    ],
    hooks: {
      async init() {
        this.someConfig = await retrieveSomeConfig()
      },
      beforeEach(to, from) {
        if(protectedRoutes.indexOf(to.path) > -1 && this.loggedIn === false) {
          return 'loginPage'
        }
      },
      error(msg) {
        this.showErrorModal(msg)
      }
    }
  }

  // ...
})
```
