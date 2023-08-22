import Component from '../component.js'
import Router from '../router.js'

export default () =>
  Component('RouterView', {
    __currentView: null,
    template: /*html*/ `
      <Element></Element>
    `,
    hooks: {
      render() {
        Router.navigate.apply(this)
        window.addEventListener('hashchange', () => Router.navigate.apply(this))
      },
    },
  })
