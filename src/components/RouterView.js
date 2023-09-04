import Component from '../component.js'
import Router from '../router.js'

let handler

export default () =>
  Component('RouterView', {
    template: `
      <Element></Element>
    `,
    hooks: {
      ready() {
        handler = () => Router.navigate.apply(this)
        Router.navigate.apply(this)
        window.addEventListener('hashchange', handler)
      },
      destroy() {
        window.removeEventListener('hashchange', handler, false)
      },
    },
  })
