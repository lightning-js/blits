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
    render: new Function('parent', 'state', 'els', 'context', code.join('\n')),
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
          let val
          // faster / better with regex maybe? let's investigate later
          if(key.startsWith('bind:') || key.startsWith(':')) {
            val = `state.${tpl[key]}`
            key = key.slice(key.indexOf(':') + 1)
          } else {
            val = castValue(tpl[key])
          }
          code.push(`els[${counter}]['${key}'] = ${val}`)
        }
  })

  return code
}

// maybe move this to the parser ...
const castValue = (val) => {

  if(typeof val === 'string' && val.startsWith('0x')) {
      return val.toString()
  }
  let float = parseFloat(val)

  if(typeof val === 'string' && val.startsWith('$')) {
      return `state.${val.replace('$', '')}`
  }

  if(!isNaN(float)) {
      return float
  }
  try {
      if(val.toLowerCase() === 'true' || val.toLowerCase() === 'false') {
          return val
      }
  } catch(e) {}

  return `"${val}"`

}
