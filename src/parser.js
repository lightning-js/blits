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
    const node = { ...{ type: tag.type }, ...tag.attributes }

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
    const float = parseFloat(match)
    return isNaN(float) ? match : float
  }

  return parse()
}
