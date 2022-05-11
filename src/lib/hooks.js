const cbs = {}

export const emit = (hook, id, scope) => {
  cbs[id] && cbs[id][hook] && cbs[id][hook].apply(scope)
}

export const registerHooks = (hooks = {}, id) => {
  cbs[id] = {}
  Object.keys(hooks).forEach((hook) => {
    if (typeof hooks[hook] === 'function') cbs[id][hook] = hooks[hook]
  })
}
