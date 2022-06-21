let counter = 0

export default function(templateObject = {children: []}) {
  const context = {props: []}
  const renderCode = ['var els = []']
  const updateCode = []
  counter = 0

  templateObject.children.forEach(child => {
      generateElementCode(child, renderCode, updateCode, 'parent', this, context)
  })

  renderCode.push('return els')

  return {
    render: new Function('parent', 'component', 'context', renderCode.join('\n')),
    update: new Function('component', 'els', 'context', updateCode.join('\n')),
    context
  }
}

const generateElementCode = (tpl, renderCode, updateCode, parent, scope, context) => {
  counter++
  // note, code below contains a temporary L2/L3 compatibility hack
  renderCode.push(`
    els[${counter}] = this.createElement()
    ${parent}.childList ? ${parent}.childList.add(els[${counter}]) : ${parent}.add(els[${counter}])
  `)

  parent = `els[${counter}]`

  const keys = Object.keys(tpl);
  keys.forEach(key => {
      if(key === 'children') {
          tpl.children.forEach(child => {
            // TODO: think about Component / Element naming -> maybe Tag?
            if(child.type && (child.type !== 'Component' && child.type !== 'Element') && scope && scope.components && scope.components[child.type]) {
              counter++
              if(!context[child.type]) {
                context[child.type] = scope.components[child.type]
              }
              context.props.push({props: child})
              renderCode.push(`
                els[${counter}] = context['${child.type}'](context.props[${context.props.length - 1}], ${parent})
              `)
            } else {
              generateElementCode(child, renderCode, updateCode, `${parent}`, scope, context)
            }
          })
      } else {
        if(key.indexOf(':') === 0) {
          updateCode.push(cast`${counter} ${key} ${tpl[key]}`)
        } else {
          renderCode.push(cast`${counter} ${key} ${tpl[key]}`)
        }
      }
  })
}


const normalizeColor = color => {
  if(!color.startsWith('0x')) {
    color = '0x' + (color.length === 6 ? 'ff' + color : color)
  }
  return normalizeARGB(color)
}

// this function should probably be move into a separate shared utils package
const normalizeARGB = (argb) => {
  let r = ((argb / 65536) | 0) % 256;
  let g = ((argb / 256) | 0) % 256;
  let b = argb % 256;
  let a = ((argb / 16777216) | 0);
  return [r / 255, g / 255, b / 255, a / 255];
}

const cast = (str, counter, key, val) => {

  let castedValue

  // colors
  if(key === 'color' && !val.startsWith('$')) {
    castedValue = '[' + normalizeColor(val).map(val => val) + ']'
  }
  // numeric
  else if(!isNaN(parseFloat(val))) {
      castedValue = parseFloat(val)
  }
  // boolean true
  else if(val.toLowerCase() === 'true') {
      castedValue = true
  }
  // boolean false
  else if(val.toLowerCase === 'false') {
      castedValue = false
  }
  // dynamic value
  else if(val.startsWith('$')) {
      castedValue = key === 'color' ? `this.normalizeARGB(component.state.${val.replace('$', '')})` : `component.state.${val.replace('$', '')}`
  }
  // static string
  else {
      castedValue = `"${val}"`
  }

  // reactive value (for now just remove the colons, rethink this part to be more efficient!)
  if(key.startsWith(':')) {
    key = key.substring(1)
  }

  return `els[${counter}]['${key}'] = ${castedValue}`
}
