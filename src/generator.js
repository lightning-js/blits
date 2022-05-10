let counter = 0
export default function(templateObject = {children: []}) {
  const context = {props: []}
  const code = ['if(!els) var els = []']
  counter = 0

  templateObject.children.forEach(child => {
      generateElementCode(child, code, 'parent', this, context)
  })

  code.push('return els')
  return {
    render: new Function('parent', 'component', 'els', 'context', code.join('\n')),
    context
  }
}

const generateElementCode = (tpl, code, parent, scope, context) => {
  counter++
  code.push(`
      if(!els[${counter}]) {
          els[${counter}] = this.createElement()
          ${parent}.childList.add(els[${counter}])
      }
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
              code.push(`
                if(!els[${counter}]) {
                  els[${counter}] = context['${child.type}'](context.props[${context.props.length - 1}], ${parent})
                }
              `)
            } else {
              generateElementCode(child, code, `${parent}`, scope, context)
            }
          })
      } else {
        code.push(cast`${counter} ${key} ${tpl[key]}`)
      }
  })

  return code
}




const normalizeColor = color => {
  if(!color.startsWith('0x')) {
    color = '0x' + (color.length === 6 ? 'ff' + color : color)
  }
  return color
}


const cast = (str, counter, key, val) => {

  let castedValue

  // colors
  if(key === 'color' && !val.startsWith('$')) {
    castedValue = normalizeColor(val)
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
      castedValue = `component.state.${val.replace('$', '')}` // todo normalize color
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
