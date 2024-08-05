# File structure

Once you have created a new Blits App using the boilerplate described in the [Getting started](getting_started.md), you should have a project with all the basics you need.

Let's review the basic file structure, and take a closer look at the important ones.

## package.json

In the root of your newly created app, you will obviously find a `package.json` with all the necessary (dev) dependencies.

In order to build a Blits based Lightning 3 app, all you need is `@lightningjs/blits` as a dependency. Blits will take care of hooking up the Lightning 3 renderer for you behind the scenes.

Feel free to install and import any custom library that your App may need. But always be mindful of the size and impact an external dependency may have - especially when developing for low powered devices (as is often the case with Lightning apps).

## index.html

You will also find an `index.html` at the root of your project. This is where the browser will be pointed to, in order to launch your Blits App.

If you inspect the source you will see some minimal HTML. The essential parts of the HTML are the `<div>` where the canvas will be injected into, and the `<script>`-tag that points to the `index.js` of the App.

## public

There is also a `public` folder in your project. This folder is used for storing public assets, such as App images and fonts.

During development, your assets are loaded directly from this folder. And if you run a production build, the entire `public` folder is copied over to the distributable version.

## src

The `src`-folder is where all your custom App code lives.

### index.js

`src/index.js` is the entry point of your App. This file imports the Blits `Launch`-method which initializes the App.

The `Blits.Launch()`-method accepts 3 parameters:

1) `app` - the root application component
2) `target` - the HTML target to append the canvas to. This can either be an `id` of an HTML element in `index.html`, or you can pass a reference to HTML element itself
3) `settings` - an `object` with settings

### App.js

`src/App.js` is the default file where the root application component lives. It's expected to export a `Blits.Application()`-instance, which is the base component of your App.

## components and pages folder

The rest of your App can be built out using components. You are free to organize your components as you wish, but we recommend using a separate file for each component and placing them in the `src/components`-folder.

The convention is to start the component file name with a capital letter, matching the name of the component (e.g. `src/components/Loader.js` or `src/components/MenuItem.js`).

Feel free to further organize and possibly nest your Component files to your own preferences.

Pages in your App are technically just Blits components as well. But to keep things clear, we often place them in a separate `pages`-folder alongside the `components`-folder (e.g. `src/pages/Home.js` and `src/pages/Details.js`)

### Custom code

If your App needs libraries for specific (business) logic that can be shared across components (such as API calls) you can place them anywhere in your `src` folder. For example in a folder named `src/lib` or `src/api`.

