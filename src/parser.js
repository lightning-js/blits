export default (Str = '') => {
  let position = 0

  const parse = () => {
    const output = { children: [] }
    while (Str[position]) {
      if (Str.charCodeAt(position) === '<'.charCodeAt(0)) {
        if (Str.charCodeAt(position + 1) === '/'.charCodeAt(0)) {
          return output
        }

        parseNode(output)
      }
      position++
    }

    return output
  }

  const parseNode = (output) => {
    const endPosition = Str.indexOf('>', position)
    const tag = parseTag(Str.substring(position + 1, endPosition))
    const node = { ...{ ref: tag.type, type: tag.type }, ...tag.attributes }

    // self closing tag
    if (Str.charCodeAt(endPosition - 1) === '/'.charCodeAt(0)) {
      output.children.push(node)
    } else {
      position = endPosition
      const nested = parse()
      if (nested.children.length) {
        node.children = [...nested.children]
      }

      output.children.push(node)
    }
  }

  const parseTag = (tagStr) => {
    const result = {
      type: tagStr.match(/[^\s]+/).shift()
    }
    const attributes = tagStr.match(/[:*\w-]+="[^"]*"/g) || []
    if (attributes.length) {
      result['attributes'] = attributes.reduce((obj, attr) => {
        const match = /(.+)=["'](.+)["']/.exec(attr)
        if (match) {
          obj[match[1]] = parseValue(match[2])
        }
        return obj
      }, {})
    }

    return result
  }

  const parseValue = (match) => {
    // x0 color
    if(typeof match === 'string' && match.startsWith('0x')) {
      return Number(match)
    }
    // hex color (with or without alpha channel)
    if(typeof match === 'string' && match.length === 8 || match.length === 6 && !isNaN(Number('0x' + match))) {
      return Number('0x' + (match.length === 6 ? 'ff' + match : match))
    }
    if(typeof match === 'string' && (match.startsWith('()') || match.startsWith('function()'))) {
      return new Function(match)
    }
    else {
      const float = parseFloat(match)
      return isNaN(float) ? match : float
    }
  }

  return parse()
}
