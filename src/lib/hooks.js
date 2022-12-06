const cbs = {}

export const emit = (hook, name, scope) => {
  cbs[name] && cbs[name][hook] && cbs[name][hook].apply(scope)
}

export const registerHooks = (hooks = {}, name) => {
  cbs[name] = {}
  Object.keys(hooks).forEach((hook) => {
    if (typeof hooks[hook] === 'function') cbs[name][hook] = hooks[hook]
  })
}
