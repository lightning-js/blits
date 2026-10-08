import symbols from '../symbols.js'

/**
 * Internal keyboard event class that extends the native KeyboardEvent.
 * This allows us to set props on the event from the eventInitDict,
 * which is not correctly implemented on some browsers.
 *
 * @extends {KeyboardEvent}
 */
export default class InternalKeyboardEvent extends KeyboardEvent {
  [symbols.internalEvent] = true
  _keyCode = 0

  get keyCode() {
    return this._keyCode
  }

  /**
   * @param {string} type - A string with the name of the event
   * @param {KeyboardEventInit} [eventInitDict] - An object that configures the event
   */
  constructor(type, eventInitDict) {
    super(type, eventInitDict)

    if ('keyCode' in eventInitDict) {
      this._keyCode = eventInitDict.keyCode
    }
  }
}
