const listeners = {}

export default {
  registerListener(event, callback) {
    listeners[event] = listeners[event] || []
    listeners[event].push(callback)
  },
  executeListeners(event, params) {
    if (listeners[event]) {
      for (let i = 0; i < listeners[event].length; i++) {
        listeners[event][i](params)
      }
    }
  },
}
