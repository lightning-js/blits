export const screenResolutions = {
  hd: 0.66666667,
  '720p': 0.66666667,
  720: 0.66666667,
  fhd: 1,
  fullhd: 1,
  '1080p': 1,
  1080: 1,
  '4k': 2,
  '2160p': 2,
  2160: 2,
}

export const isTransition = (value) => {
  return value !== null && typeof value === 'object' && 'transition' in value === true
}

export const isObjectString = (str) => {
  return typeof str === 'string' && str.startsWith('{') && str.endsWith('}')
}

export const isArrayString = (str) => {
  return typeof str === 'string' && str.startsWith('[') && str.endsWith(']')
}

export const parseToObject = (str) => {
  return JSON.parse(str.replace(/'/g, '"').replace(/([\w-_]+)\s*:/g, '"$1":'))
}
