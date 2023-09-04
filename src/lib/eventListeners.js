const eventsMap = new Map()

export default {
  registerListener(component, event, cb) {
    let componentsMap = eventsMap.get(event)
    if (!componentsMap) {
      componentsMap = new Map()
      eventsMap.set(event, componentsMap)
    }

    let components = componentsMap.get(component)
    if (!components) {
      components = new Set()
      componentsMap.set(component, components)
    }

    components.add(cb)
  },
  executeListeners(event, params) {
    const componentsMap = eventsMap.get(event)
    if (componentsMap) {
      componentsMap.forEach((component) => {
        component.forEach((cb) => {
          cb(params)
        })
      })
    }
  },
  removeListeners(component) {
    eventsMap.forEach((componentMap) => {
      const cmp = componentMap.get(component)
      if (cmp) {
        cmp.clear()
        componentMap.delete(cmp)
      }
    })
  },
}
