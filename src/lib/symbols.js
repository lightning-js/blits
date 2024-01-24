export default {
  currentView: Symbol('currentView'),
  cursorTagStart: Symbol('cursorTagStart'),
  computedKeys: Symbol('computedKeys'),
  destroy: Symbol('destroy'),
  index: Symbol('index'),
  init: Symbol('init'),
  inputEvents: Symbol('inputEvents'),
  intervals: Symbol('intervals'),
  _intervals: Symbol('_intervals'),
  level: Symbol('level'),
  methodKeys: Symbol('methodKeys'),
  originalState: Symbol('originalState'),
  propKeys: Symbol('propKeys'),
  ready: Symbol('ready'),
  renderer: Symbol('renderer'),
  routes: Symbol('routes'),
  settings: Symbol('settings'),
  state: Symbol('state'),
  stateKeys: Symbol('stateKeys'),
  textnode: Symbol('textnode'),
  timeouts: Symbol('timeouts'),
  _timeouts: Symbol('_timeouts'),
  type: Symbol('type'),
  watchers: Symbol('watchers'),
  watchKeys: Symbol('watchKeys'),
  wrapper: Symbol('wrapper'),

  /* Utilizing the global Symbol registry for the following purposes */

  // Symbol 'children' utilized within generated code
  children: Symbol.for('children'),
  // Symbol 'components' utilized within generated code
  components: Symbol.for('components'),
  // Symbol 'isSlot' utilized within generated code
  isSlot: Symbol.for('isSlot'),
  // Symbol 'props' utilized within generated code
  props: Symbol.for('props'),
  // Symbol 'slots' utilized within generated code
  slots: Symbol.for('slots'),
}
