/**
 * Resolves a sprite sheet frame from map + frame (template Sprite element path on L3).
 * @param {import('../../component').BlitsElement} element
 * @param {object} r - renderer
 * @param {{ spriteTexture: any, currentSrc: any }} state - mutated
 * @returns {any|null} texture for the node
 */
export function resolveSpriteTexture(element, r, state) {
  const image = element.props.raw['image']
  if (image === undefined || image === null) {
    return null
  }
  if (r === null || r === undefined || r.createTexture === undefined) {
    return null
  }

  if (
    state.spriteTexture === undefined ||
    state.spriteTexture === null ||
    state.currentSrc !== image
  ) {
    state.spriteTexture = r.createTexture('ImageTexture', {
      src: image,
    })
    state.currentSrc = image
  }

  const map = element.props.raw['map']
  const frame = element.props.raw['frame']

  let options = null
  if (map != null && frame != null) {
    if (map.frames != null && map.frames !== undefined && frame in map.frames) {
      options = Object.assign({}, map.defaults || {}, map.frames[frame])
    } else if (frame in map) {
      options = map[frame]
    }
  }

  if ((options === null || options === undefined) && typeof frame === 'object' && frame !== null) {
    options = frame
  }

  if (options != null) {
    return r.createTexture('SubTexture', {
      texture: state.spriteTexture,
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
    })
  }
  return state.spriteTexture
}
