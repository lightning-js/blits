/**
 * Resolves a sprite sheet frame from map + frame (template Sprite element path on L3).
 * @param {import('../../component.js').BlitsElement} element
 * @param {object} r - renderer
 * @param {any} state - mutated sprite cache (see L3 element _spriteState)
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
    state.subTextures = null
    state.currentMap = null
  }

  const map = element.props.raw['map']

  if (state.currentMap !== map) {
    state.currentMap = map
    state.subTextures = null
  }
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
    const key = typeof frame === 'object' ? JSON.stringify(frame) : String(frame)
    if (!state.subTextures) {
      state.subTextures = new Map()
    }
    const cached = state.subTextures.get(key)
    if (cached !== undefined) {
      return cached
    }
    const subTexture = r.createTexture('SubTexture', {
      texture: state.spriteTexture,
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
    })
    state.subTextures.set(key, subTexture)
    return subTexture
  }
  return state.spriteTexture
}
