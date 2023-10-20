export default {
  children: Symbol('children'),
  currentView: Symbol('currentView'),
  computedKeys: Symbol('computedKeys'),
  destroy: Symbol('destroy'),
  index: Symbol('index'),
  init: Symbol('init'),
  inputEvents: Symbol('inputEvents'),
  intervals: Symbol('intervals'),
  _intervals: Symbol('_intervals'),
  level: Symbol('level'),
  methodKeys: Symbol('methodKeys'),
  propKeys: Symbol('propKeys'),
  renderer: Symbol('renderer'),
  settings: Symbol('settings'),
  state: Symbol('state'),
  stateKeys: Symbol('stateKeys'),
  textnode: Symbol('textnode'),
  timeouts: Symbol('timeouts'),
  _timeouts: Symbol('_timeouts'),
  type: Symbol('type'),
  watchers: Symbol('watchers'),
  watchKeys: Symbol('watchKeys'),

  /* following use global Symbol registry */

  // used in generated code
  props: Symbol.for('props'),
  // routes access in: https://github.com/lightning-js/blits-example-app/blob/1b4a89ae28c6e23a7a828cad3471bec8b61be704/src/App.js#L104
  routes: Symbol.for('routes'),
  // used in generated code
  id: Symbol.for('id'),
  // used in generated code
  components: Symbol.for('components'),
}
