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
    const result = {}
    const parts = tagStr.split(' ')

    result['type'] = parts.shift()
    if (parts.length) {
      result['attributes'] = parts.reduce((obj, attr) => {
        const match = /(.+)=["'](.+)["']/.exec(attr)
        if (match) {
          const val = parseFloat(match[2])
          obj[match[1]] = isNaN(val) ? match[2] : val
        }
        return obj
      }, {})
    }

    return result
  }

  return parse()
}
