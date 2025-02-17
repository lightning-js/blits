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

To define a param in a route path, prefix a string with a colon (`:`), followed by the name of the param, e.g. `/movies/:genre/:id`. This route path will match a URI hash such as `#/movies/sci-fi/65281918`. The router will take the params and inject them as a `prop` into the Page that's being navigated to.

To access these props in the Page component, they must first be defined in the Page component as _props_ first (i.e. `props: ['genre', 'id']`). Once defined, the values (`sci-fi` and `65281918`) in this case, will be available on the `this` scope as `this.genre` and `this.id` (or as `$genre` and `$id` when used in the template), as with any regular Component.

#### Using query parameters in routes

According to the browser specifications, query parameters are not part of a URL hash. This means that query parameters should be placed _before_ the URL hash (i.e. `http://localhost:5173?id=100&name=john#/my/page/hash`) and implies that "real" query parameters are _not_ part of the route paths.

In this case `id` and `name` won't automatically be made available as props inside a Blits component. They can however be retrieved using `document.location.search` in combination with `new URLSearchParams`, and can be used in an App's `index.js` to set dynamic launch settings for example.

Sometimes you may actually want pass custom data into a Blits component, without it being part of the dynamic route path or `data`-object during navigation. For these cases Blits allows you to use query parameters as part of a route (i.e. `#/series/simpsons/5/10?id=100&name=john`).

This URL hash will match the route `/series/:show/:season/:episode` and it will pass `id` and `name` as additional props into the Page component. Note: similar to dynamic path params, route query params should also be be defined in the Page component as _props_ first (i.e. `props: ['id', 'name']`) in order to be accessed on the `this`-scope.

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

## Deeplinking

The Router plugin has support for deeplinking. When the App is loaded with a URL hash (i.e. `#/pages/settings/network`), the router will try to match that hash to a defined route. This means that your app can be deep linked into, by simply providing the correct URL hash.

This is an important feature for several reasons:

- It will allow external sources (like operators and UIs) to link directly to a specific page in your app (i.e. the details page of a specific movie)
- If dynamic routes are used, the App only loads what is needed, to keep memory usage low and the initial load time fast
- Data provided in the URL hash can still be used to set the initial state of the App

## Backtracking

When a user enters your App via a deeplink, there is technically no history available. By default, this means that a Back keypress goes straight to
the App's `root`-route (i.e. the `Blits.Application()`-component).

In some cases, you may want walk back down the logical path of the deeplinked page instead, and navigate to the first existing parent route (i.e. go from `/movies/comedy/american-pie` to `/movies/comedy`).

By setting the route option `backtrack` to `true` in the route definition (or in the `this.$router.to()`-method), the router will recursively remove the last part of the route hash, until it finds a valid path to navigate to.

```js
{
  path: '/examples/router-hooks/episode/:id',
  component: Episode,
  transition: PageTransitions.slideInOutUp,
  options: {
    backtrack: true,
  },
},
{
  path: '/examples/router-hooks/episode',
  component: EpisodesOverview,
},
```

In the example above, the `backtrack` option is set to `true` for the `/examples/router-hooks/episode/:id` route. When the user navigates to `/examples/router-hooks/episode/1`, the `back` input action will navigate to `/examples/router-hooks/episode` instead of exiting the App.

## Router API

The Router API provides several useful methods and properties for managing routes and navigation:

- `this.$router.to()` - navigating to a different location (as discussed above)
- `this.$router.back()` - programmatically navigate back down the history stack
- `this.$router.currentRoute` - retrieve the current route
- `this.$router.routes` - retrieve the list of all routes
- `this.$router.navigating` - retrieve the current navigating state
- `this.$router.state` - reactive router state (see below)

### Reactive router state

The reactive router state (`this.$router.state`) can be useful in situations where you want to hook up reactive changes in your App to Route changes.

The `state` variable on the `this.$router` object returns a reactive object with 2 keys: `path` and `navigating`. The values of these keys will automaticaly update when the router navigates from one page to another.

The router state changes can be used in a Blits template, they can be _watched_ and they can be used in generic busines logic, as demonstrated in the example below.

```js
export default Blits.Component('MyComponent', {
  template: `
    <Element w="1920" h="1080">
      <!-- dynamically display the current path -->
      <Text x="100" h="100" :content="$$router.state.path" />
      <!-- show loading text when router is navigating -->
      <Text :show="$showLoader">Loading ...</Text>
    </Element>
  `,
  watch: {
    '$router.state.path'(v, old) {
      Log.info(`Router Path changed from ${old} to ${v}`)
    }
  },
  computed: {
    showLoader() {
      return this.$router.state.navigating
    }
  }
})
```
