import { cubicBezier } from 'animejs'

const cubicBezierRegex = /-?\d*\.?\d+/g

const easings = {
  ease: cubicBezier(0.25, 0.1, 0.25, 1.0),
  'ease-in': cubicBezier(0.42, 0, 1.0, 1.0),
  'ease-out': cubicBezier(0, 0, 0.58, 1.0),
  'ease-in-out': cubicBezier(0.42, 0, 0.58, 1.0),
  'ease-in-sine': cubicBezier(0.12, 0, 0.39, 0),
  'ease-out-sine': cubicBezier(0.12, 0, 0.39, 0),
  'ease-in-out-sine': cubicBezier(0.37, 0, 0.63, 1),
  'ease-in-cubic': cubicBezier(0.32, 0, 0.67, 0),
  'ease-out-cubic': cubicBezier(0.33, 1, 0.68, 1),
  'ease-in-out-cubic': cubicBezier(0.65, 0, 0.35, 1),
  'ease-in-circ': cubicBezier(0.55, 0, 1, 0.45),
  'ease-out-circ': cubicBezier(0, 0.55, 0.45, 1),
  'ease-in-out-circ': cubicBezier(0.85, 0, 0.15, 1),
  'ease-in-back': cubicBezier(0.36, 0, 0.66, -0.56),
  'ease-out-back': cubicBezier(0.34, 1.56, 0.64, 1),
  'ease-in-out-back': cubicBezier(0.68, -0.6, 0.32, 1.6),
}

const timingLookupTable = {}

export const normalizeToEase = (easing) => {
  if (easing === undefined || easing === null) {
    return 'linear'
  }
  let ease = easings[easing] || timingLookupTable[easing]
  if (ease !== undefined) {
    return ease
  }
  //assume easing must be a cubic-bezier string, so parse it and create a cubicBezier function
  const match = easing.match(cubicBezierRegex)
  if (match && match.length === 4) {
    ease = cubicBezier(...match.map(Number))
    timingLookupTable[easing] = ease
    return ease
  }

  return 'linear'
}
