import Settings from '../settings.js'

const n = () => {}

const time = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

const logger = (context) => {
  const level = Settings.get('debugLevel')
  const log = {}

  Object.defineProperty(log, 'info', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('info') > -1)) &&
          console.info.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #0284c7; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'warn', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('warn') > -1)) &&
          console.warn.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #fbbf24; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'error', {
    get() {
      return (
        ((level >= 1 || (Array.isArray(level) && level.indexOf('error') > -1)) &&
          console.error.bind(
            window.console,
            `%c ⚡️ ${context} %c ${time()}`,
            'background-color: #dc2626; color: white; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  Object.defineProperty(log, 'debug', {
    get() {
      return (
        ((level >= 2 || (Array.isArray(level) && level.indexOf('debug') > -1)) &&
          console.debug.bind(
            window.console,
            `%c ⚡️ ${context} %c (${new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })})`,
            'background-color: #e2e8f0; color: #334155; padding: 3px 6px 3px 1px; border-radius: 3px',
            'color: ##94a3b8;'
          )) ||
        n
      )
    },
  })

  return log
}

export default logger

export let Log
// review this pattern
export const initLog = () => {
  Log = logger('Bolt')
}
