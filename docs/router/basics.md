# Router Basics

The Blits framework comes with a built-in, performant router that eliminates the need to pull in any additional dependencies into your App.

Before we dive into the details, let's first touch base on some key concepts.

## Key concepts

### Pages are regular Blits Components

The router in Blits is primarily used to navigate between Pages in your App. In the context of a Blits App, a Page is just a regular Blits Component. Usually it will be a Component that fills the entire screen. But it is also possible to have only a smaller portion of the screen contain dynamic routed content.

### URL hash

When navigating to a page, the hash in the URL of the browser will automatically be updated (i.e. `http://localhost:8080/#my/page`) to match the current page. The hash can also be used to _deep-link_ directly into your application. Upon first load, the router functionality will evaluate the URL hash and try to match that to a defined route. If a matching route is found, it will load that page as deep linked content.

## Defining Routes

Routes are defined in the main Application component, as an Array under the `routes` key of the configuration object.

Each route in this array, is an Object literal that includes the following key properties:

- `path` - the url hash to the route (i.e. `/my/page`)
- `component` - the Blits component to render for the route. This can be a direct reference, but also a promise or a dynamic import that resolves to a Blits component
- `hooks` (optional) - hooks such as `before` can be defined to execute code before navigating to the route
- `options` (optional) - additional options defining route behaviour, such as `keepAlive` and `inHistory`
- `transitions` (optional) - used to define custom transitions between pages

### Dynamic routes with params

Besides static routes such as `/account` and `/settings/wifi/advanced`, the Blits router also supports dynamic routes where URI parts can contain params.

To define a param in a route path prefix a string with a colon (`:`), followed by the name of the param, e.g. `/movies/:genre/:id`. This route path will match a URI hash such as `#/movies/sci-fi/65281918`. The router will take the params and inject them as a `prop` into the Page that's being navigated to.

To access these props in the Page component, they must first be defined in the Component first (i.e. `props: ['genre', 'id']`). Once defined, the values (`sci-fi` and `65281918`) in this case, will be available on the `this` scope, as with any regular Component.


## Router view

The routes are loaded into a `<RouterView />` component, which acts as a placeholder for the routed Page components.

The `<RouterView />` component can be positioned and sized as you would expect from a normal Blits Component.


```js
export default Blits.Application({
  template: `
    <Element>
      <RouterView x="300" y="200" w="1520" h="680" />
    </Element>
  `,
  routes: [
      { path: '/', component: Home },
      { path: '/details', component: () => import('./pages/Details.js'), },
      { path: '/account',
        component: () => {
          // imagine this is an API call or some other async action
          return new Promise((resolve) => {
            resolve(Account)
          })
        }
      }
  ],
  // ...
})
```

## Navigation

Each component in a routed Blits app has a `this.$router` object that provides access to the Router instance. It can be used to programmatically navigate to pages, by calling the `to()` method on it.

The `this.$router.to()`-methods accepts 3 arguments:

- `path` - the path of the route to navigate to
- `data` (optional) - an object with data to pass into the page as `props`
- `options` (optional) - additional options defining route behaviour, such as `keepAlive` and `inHistory` (these will overwrite any options specified for a route in the routes array)

```js
export default Blits.Component('Poster', {
  input: {
    enter() {
      this.$router.to('/movie/details', {id: '1', img: 'details.png'}, {inHistory: false})
    }
  }
})
```

Whenever you navigate to a new page, the URL hash will automatically be updated. Unless specified otherwise, navigating to a new page, will add that route to the history stack. The `back` input action is automatically wired up to navigate back down the history stack.

## Router API

The Router API provides several useful methods and properties for managing routes and navigation:

- `this.$router.to()` - navigating to a different location (as discussed above)
- `this.$router.back()` - programmatically navigate back down the history stack
- `this.$router.currentRoute` - retrieve the current route
- `this.$router.routes` - retrieve the list of all routes
- `this.$router.navigating` - retrieve the current navigating state
