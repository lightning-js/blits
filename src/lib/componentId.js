const counters = {}
let counter = 0

export const createHumanReadableId = (name) => {
  return `BoltComponent::${name}_${(counters[name] = (counters[name] || 0) + 1)}`
}

export const createInternalId = () => {
  return ++counter
}
